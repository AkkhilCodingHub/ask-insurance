import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { uploadToR2, r2KeyFromUrl, deleteFromR2 } from '../lib/r2';
import {
  buildAuthUrl, exchangeCode, fetchIssuedFiles, fetchUploadedFiles,
  generateState, parseState, generateCodeVerifier, deriveCodeChallenge,
} from '../lib/digilocker';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_DOC_TYPES = ['aadhaar', 'driving_license', 'passport'] as const;

// Manual document upload for KYC
router.post('/upload', authenticate, upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const file = (req as any).file as Express.Multer.File | undefined;

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

    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, kycDocUrl: true },
    });
    if (!userRow) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const st = userRow.kycStatus;
    if (st === 'submitted') {
      res.status(409).json({ error: 'KYC is already under review. You cannot upload again until the review completes.' });
      return;
    }
    if (st === 'verified') {
      res.status(409).json({ error: 'KYC is already verified.' });
      return;
    }

    const ext = file.mimetype === 'application/pdf' ? 'pdf'
      : file.mimetype === 'image/png' ? 'png'
        : file.mimetype === 'image/webp' ? 'webp'
          : 'jpg';

    const key = `kyc/${userId}/${Date.now()}.${ext}`;
    const url = await uploadToR2(key, file.buffer, file.mimetype);

    if (userRow.kycDocUrl) {
      const oldKey = r2KeyFromUrl(userRow.kycDocUrl);
      if (oldKey) deleteFromR2(oldKey).catch(() => { });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'submitted',
        kycDocType: docType,
        kycDocUrl: url,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
        kycVerifiedAt: null,
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

// Initiate DigiLocker OAuth flow
router.get('/initiate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.DIGILOCKER_CLIENT_ID) {
      res.status(503).json({ error: 'DigiLocker integration is not configured on this server.' });
      return;
    }

    const userId = (req as any).userId as string;
    const state = generateState(userId);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = deriveCodeChallenge(codeVerifier);
    const url = buildAuthUrl(state, codeChallenge);

    res.json({ url, state, codeVerifier });
  } catch (error) {
    console.error('[kyc/initiate]', error);
    res.status(500).json({ error: 'Failed to initiate DigiLocker KYC' });
  }
});

// HTTPS redirect bridge for DigiLocker OAuth callback
router.get('/callback', (req: Request, res: Response): void => {
  const appRedirect = process.env.DIGILOCKER_APP_REDIRECT || 'askinsurance://kyc-callback';
  const params = new URLSearchParams();
  const errorParam = req.query.error || req.query.error_description;

  for (const key of ['code', 'state', 'error', 'error_description'] as const) {
    const v = req.query[key];
    if (typeof v === 'string' && v) params.set(key, v);
  }
  const target = `${appRedirect}?${params.toString()}`;
  const targetJs = JSON.stringify(target);
  const targetAttr = target
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  if (errorParam) {
    const errText = String(req.query.error_description || req.query.error || 'DigiLocker verification failed.');
    res.type('html').send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verification Failed</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#090d16;color:#f8fafc}
  .card{text-align:center;padding:36px 24px;max-width:340px;background:#111827;border-radius:20px;border:1px solid #1f2937}
  .icon{width:56px;height:56px;margin:0 auto 16px;border-radius:28px;background:#ef44441a;color:#ef4444;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold}
  h2{font-size:18px;font-weight:800;margin:0 0 8px;color:#f8fafc}
  p{font-size:14px;line-height:1.5;color:#9ca3af;margin:0 0 24px}
  a.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
    font-weight:700;padding:14px 24px;border-radius:12px;font-size:14px}
</style></head>
<body><div class="card">
  <div class="icon">✕</div>
  <h2>Verification Failed</h2>
  <p>${errText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  <a class="btn" href="${targetAttr}">Return to App</a>
</div>
<script>
  setTimeout(function(){ window.location.href = ${targetJs}; }, 1500);
</script>
</body></html>`);
    return;
  }

  res.type('html').send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Returning to app…</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#090d16;color:#f8fafc}
  .card{text-align:center;padding:36px 24px;max-width:320px;background:#111827;border-radius:20px;border:1px solid #1f2937}
  .spin{width:42px;height:42px;margin:0 auto 20px;border:4px solid #1f2937;
    border-top-color:#2563eb;border-radius:50%;animation:r .7s linear infinite}
  @keyframes r{to{transform:rotate(360deg)}}
  p{font-size:15px;line-height:1.5;color:#9ca3af;margin:0}
</style></head>
<body><div class="card">
  <div class="spin"></div>
  <p>Verification complete.<br>Opening app…</p>
</div>
<script>
  var t = ${targetJs};
  window.location.replace(t);
  setTimeout(function(){ window.location.href = t; }, 200);
</script>
</body></html>`);
});

// Complete DigiLocker verification and fetch document items
router.post('/callback', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, codeVerifier } = z.object({
      code: z.string().min(1),
      state: z.string().min(1),
      codeVerifier: z.string().min(43).max(128),
    }).parse(req.body);

    const userId = (req as any).userId as string;

    const parsed = parseState(state);
    if (!parsed || parsed.userId !== userId) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    const tokens = await exchangeCode(code, codeVerifier);

    const [issuedFiles, uploadedFiles] = await Promise.all([
      fetchIssuedFiles(tokens.access_token).catch(() => []),
      fetchUploadedFiles(tokens.access_token).catch(() => []),
    ]);

    const files = [...issuedFiles, ...uploadedFiles];

    const hasAadhaar = files.some(f =>
      f.doctype?.toLowerCase().includes('aadhaar') ||
      f.name?.toLowerCase().includes('aadhaar') ||
      f.issuer?.toLowerCase().includes('uidai'),
    );

    const panFile = files.find(f =>
      f.doctype?.toLowerCase().includes('pan') ||
      f.name?.toLowerCase().includes('pan'),
    );

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: 'verified',
        digilockerSub: tokens.digilockerid,
        aadhaarVerified: hasAadhaar,
        panNumber: panFile?.uri ?? null,
        kycDocuments: files as any,
        kycVerifiedAt: new Date(),
        ...(tokens.name && !(await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name
          ? { name: tokens.name } : {}),
        ...(tokens.dob ? (() => { const d = parseDigiLockerDob(tokens.dob!); return d ? { dateOfBirth: d } : {}; })() : {}),
        ...(tokens.gender ? { gender: tokens.gender } : {}),
      },
    });

    res.json({
      success: true,
      kycStatus: updatedUser.kycStatus,
      aadhaarVerified: updatedUser.aadhaarVerified,
      documentsCount: files.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'code, state and codeVerifier are required' });
      return;
    }
    console.error('[kyc/callback]', error);
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `KYC verification failed: ${detail}` });
  }
});

// Get user KYC status
router.get('/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true, aadhaarVerified: true, kycVerifiedAt: true, panNumber: true,
        kycDocType: true, kycDocUrl: true, kycRejectionReason: true, kycSubmittedAt: true,
      },
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    res.json({
      kycStatus: user.kycStatus,
      aadhaarVerified: user.aadhaarVerified,
      kycVerifiedAt: user.kycVerifiedAt,
      hasPan: Boolean(user.panNumber),
      kycDocType: user.kycDocType,
      kycDocUrl: user.kycDocUrl,
      kycRejectionReason: user.kycRejectionReason,
      kycSubmittedAt: user.kycSubmittedAt,
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
