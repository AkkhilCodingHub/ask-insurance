import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { uploadToR2, r2KeyFromUrl, deleteFromR2 } from '../lib/r2';
import {
  buildAuthUrl, exchangeCode, fetchIssuedFiles,
  generateState, parseState,
} from '../lib/digilocker';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_DOC_TYPES = ['aadhaar', 'driving_license', 'passport'] as const;

// ── POST /kyc/upload ──────────────────────────────────────────────────────────
// User uploads a document (Aadhaar, Driving Licence, Passport) for manual KYC.

router.post('/upload', authenticate, upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const file   = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ error: 'No document file uploaded.' });
      return;
    }

    if (!ALLOWED_TYPES.has(file.mimetype)) {
      res.status(400).json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed.' });
      return;
    }

    const { docType } = z.object({
      docType: z.enum(ALLOWED_DOC_TYPES),
    }).parse(req.body);

    const ext = file.mimetype === 'application/pdf' ? 'pdf'
      : file.mimetype === 'image/png' ? 'png'
      : file.mimetype === 'image/webp' ? 'webp'
      : 'jpg';

    const key = `kyc/${userId}/${Date.now()}.${ext}`;
    const url = await uploadToR2(key, file.buffer, file.mimetype);

    // Delete old document from R2 if replacing
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { kycDocUrl: true } });
    if (existing?.kycDocUrl) {
      const oldKey = r2KeyFromUrl(existing.kycDocUrl);
      if (oldKey) deleteFromR2(oldKey).catch(() => {});
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus:          'submitted',
        kycDocType:         docType,
        kycDocUrl:          url,
        kycSubmittedAt:     new Date(),
        kycRejectionReason: null,
        kycVerifiedAt:      null,
      },
    });

    res.json({ success: true, kycStatus: 'submitted', docUrl: url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'docType must be aadhaar, driving_license, or passport.' });
      return;
    }
    console.error('[kyc/upload]', error);
    res.status(500).json({ error: 'Failed to upload KYC document. Please try again.' });
  }
});

// ── GET /kyc/initiate ─────────────────────────────────────────────────────────
// Returns the DigiLocker OAuth URL for the authenticated user.

router.get('/initiate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.DIGILOCKER_CLIENT_ID || !process.env.DIGILOCKER_CLIENT_SECRET) {
      res.status(503).json({ error: 'DigiLocker integration is not configured on this server.' });
      return;
    }

    const userId = (req as any).userId as string;
    const state  = generateState(userId);
    const url    = buildAuthUrl(state);

    res.json({ url, state });
  } catch (error) {
    console.error('[kyc/initiate]', error);
    res.status(500).json({ error: 'Failed to initiate DigiLocker KYC' });
  }
});

// ── POST /kyc/callback ────────────────────────────────────────────────────────
// Called by the mobile app after DigiLocker redirects back with ?code=&state=
// Exchanges the code, fetches documents, and updates the user's KYC status.

router.post('/callback', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = z.object({
      code:  z.string().min(1),
      state: z.string().min(1),
    }).parse(req.body);

    const userId = (req as any).userId as string;

    // Verify state belongs to this user
    const parsed = parseState(state);
    if (!parsed || parsed.userId !== userId) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Exchange code for DigiLocker tokens
    const tokens = await exchangeCode(code);

    // Fetch issued documents (Aadhaar, PAN, etc.)
    const files = await fetchIssuedFiles(tokens.access_token);

    // Check what documents were fetched
    const hasAadhaar = files.some(f =>
      f.doctype?.toLowerCase().includes('aadhaar') ||
      f.name?.toLowerCase().includes('aadhaar') ||
      f.issuer?.toLowerCase().includes('uidai'),
    );

    const panFile = files.find(f =>
      f.doctype?.toLowerCase().includes('pan') ||
      f.name?.toLowerCase().includes('pan'),
    );

    // Update user KYC fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data:  {
        kycStatus:       'verified',
        digilockerSub:   tokens.digilockerid,
        aadhaarVerified: hasAadhaar,
        panNumber:       panFile?.uri ?? null,
        kycDocuments:    files as any,
        kycVerifiedAt:   new Date(),
        // Pre-fill profile fields from DigiLocker if not already set
        ...(tokens.name   && !( await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name
          ? { name: tokens.name } : {}),
        ...(tokens.dob ? (() => { const d = parseDigiLockerDob(tokens.dob!); return d ? { dateOfBirth: d } : {}; })() : {}),
        ...(tokens.gender ? { gender: tokens.gender } : {}),
      },
    });

    res.json({
      success:  true,
      kycStatus: updatedUser.kycStatus,
      aadhaarVerified: updatedUser.aadhaarVerified,
      documentsCount:  files.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'code and state are required' });
      return;
    }
    console.error('[kyc/callback]', error);
    res.status(500).json({ error: 'KYC verification failed. Please try again.' });
  }
});

// ── GET /kyc/status ───────────────────────────────────────────────────────────

router.get('/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const user   = await prisma.user.findUnique({
      where:  { id: userId },
      select: {
        kycStatus: true, aadhaarVerified: true, kycVerifiedAt: true, panNumber: true,
        kycDocType: true, kycDocUrl: true, kycRejectionReason: true, kycSubmittedAt: true,
      },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    res.json({
      kycStatus:          user.kycStatus,
      aadhaarVerified:    user.aadhaarVerified,
      kycVerifiedAt:      user.kycVerifiedAt,
      hasPan:             Boolean(user.panNumber),
      kycDocType:         user.kycDocType,
      kycDocUrl:          user.kycDocUrl,
      kycRejectionReason: user.kycRejectionReason,
      kycSubmittedAt:     user.kycSubmittedAt,
    });
  } catch (error) {
    console.error('[kyc/status]', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// ── Helper ────────────────────────────────────────────────────────────────────

function parseDigiLockerDob(dob: string): Date | undefined {
  // DigiLocker returns DOB as DDMMYYYY (e.g. "31121970")
  if (dob.length !== 8) return undefined;
  const dd = dob.slice(0, 2), mm = dob.slice(2, 4), yyyy = dob.slice(4, 8);
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  return isNaN(d.getTime()) ? undefined : d;
}

export { router as kycRouter };
