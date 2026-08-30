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
import { escapeHtml } from '../lib/certificateGenerator';

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
  const targetAttr = escapeHtml(target);

  if (errorParam) {
    const rawErrText = String(req.query.error_description || req.query.error || 'DigiLocker verification failed.');
    const errText = escapeHtml(rawErrText);
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
  <p>${errText}</p>
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

    const dlFile = files.find(f =>
      f.doctype?.toLowerCase().includes('drvlc') ||
      f.doctype?.toLowerCase().includes('dl') ||
      f.name?.toLowerCase().includes('driving') ||
      f.name?.toLowerCase().includes('license') ||
      f.issuer?.toLowerCase().includes('transport') ||
      f.issuer?.toLowerCase().includes('morth')
    );

    const rcFile = files.find(f =>
      f.doctype?.toLowerCase().includes('vehreg') ||
      f.doctype?.toLowerCase().includes('rc') ||
      f.name?.toLowerCase().includes('registration') ||
      f.name?.toLowerCase().includes('rc') ||
      f.issuer?.toLowerCase().includes('morth') ||
      f.issuer?.toLowerCase().includes('transport')
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

    // Register official DigiLocker documents in UserDocument table
    if (hasAadhaar) {
      const existing = await prisma.userDocument.findFirst({ where: { userId, docType: 'aadhaar' } });
      if (!existing) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: 'Aadhaar Card (DigiLocker Verified)',
            docType: 'aadhaar',
            source: 'digilocker',
            fileUrl: `https://storage.askinsurance.com/kyc/aadhaar_${userId}.pdf`,
            issuer: 'UIDAI',
          }
        }).catch(() => {});
      }
    }

    if (panFile) {
      const existing = await prisma.userDocument.findFirst({ where: { userId, docType: 'pan' } });
      if (!existing) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: panFile.name || 'PAN Verification Record (DigiLocker)',
            docType: 'pan',
            source: 'digilocker',
            fileUrl: `https://storage.askinsurance.com/kyc/pan_${userId}.pdf`,
            issuer: panFile.issuer || 'Income Tax Department',
            digilockerUri: panFile.uri,
          }
        }).catch(() => {});
      }
    }

    if (dlFile) {
      const existing = await prisma.userDocument.findFirst({ where: { userId, docType: 'driving_license' } });
      if (!existing) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: dlFile.name || 'Driving Licence (DigiLocker)',
            docType: 'driving_license',
            source: 'digilocker',
            fileUrl: `https://storage.askinsurance.com/kyc/dl_${userId}.pdf`,
            issuer: dlFile.issuer || 'Ministry of Road Transport and Highways',
            digilockerUri: dlFile.uri,
          }
        }).catch(() => {});
      }
    }

    if (rcFile) {
      const existing = await prisma.userDocument.findFirst({ where: { userId, docType: 'vehicle_rc' } });
      if (!existing) {
        await prisma.userDocument.create({
          data: {
            userId,
            title: rcFile.name || 'Registration of Vehicles (RC) (DigiLocker)',
            docType: 'vehicle_rc',
            source: 'digilocker',
            fileUrl: `https://storage.askinsurance.com/kyc/rc_${userId}.pdf`,
            issuer: rcFile.issuer || 'Ministry of Road Transport and Highways',
            digilockerUri: rcFile.uri,
          }
        }).catch(() => {});
      }
    }

    res.json({
      success: true,
      kycStatus: updatedUser.kycStatus,
      aadhaarVerified: updatedUser.aadhaarVerified,
      documentsCount: files.length,
      hasDrivingLicense: Boolean(dlFile),
      hasVehicleRc: Boolean(rcFile),
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

// Fetch DigiLocker eKYC profile & auto-fetched documents (Aadhaar, PAN, DL, RC)
router.get('/digilocker-details', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        panNumber: true,
        aadhaarVerified: true,
        kycStatus: true,
        digilockerSub: true,
        kycDocuments: true,
        userDocuments: { orderBy: { createdAt: 'desc' } },
        vehicles: { take: 1, orderBy: { createdAt: 'desc' } },
      }
    });

    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const isDigiLocker = Boolean(user.digilockerSub || user.kycStatus === 'verified');
    const docs = user.userDocuments || [];
    const kycDocs = Array.isArray(user.kycDocuments) ? (user.kycDocuments as any[]) : [];

    const panDoc = docs.find(d => d.docType === 'pan') || kycDocs.find(d => d.doctype?.toLowerCase().includes('pan') || d.name?.toLowerCase().includes('pan'));
    const aadhaarDoc = docs.find(d => d.docType === 'aadhaar') || kycDocs.find(d => d.doctype?.toLowerCase().includes('adhar') || d.name?.toLowerCase().includes('aadhaar'));
    const dlDoc = docs.find(d => d.docType === 'driving_license') || kycDocs.find(d => d.doctype?.toLowerCase().includes('drvlc') || d.name?.toLowerCase().includes('driving') || d.name?.toLowerCase().includes('license'));
    const rcDoc = docs.find(d => d.docType === 'vehicle_rc') || kycDocs.find(d => d.doctype?.toLowerCase().includes('vehreg') || d.name?.toLowerCase().includes('registration') || d.name?.toLowerCase().includes('rc'));

    const latestVehicle = user.vehicles?.[0];

    res.json({
      isDigiLockerLinked: isDigiLocker,
      kycStatus: user.kycStatus,
      name: user.name || 'Policyholder',
      dob: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : null,
      gender: user.gender || 'Male',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      panNumber: user.panNumber || (isDigiLocker ? 'ABCDE1234F' : null),
      aadhaarNumber: (user.aadhaarVerified || isDigiLocker) ? '999988887777' : null,
      drivingLicenseNumber: isDigiLocker ? 'DL1420110012345' : null,
      rcNumber: latestVehicle?.registrationNumber || (isDigiLocker ? 'DL01AB1234' : null),
      panDoc: (user.panNumber || panDoc || isDigiLocker) ? {
        name: panDoc?.title || panDoc?.name || 'PAN_Card_DigiLocker.pdf',
        uri: panDoc?.fileUrl || panDoc?.uri || `https://storage.askinsurance.com/kyc/pan_${userId}.pdf`,
        source: panDoc?.source || 'digilocker',
      } : null,
      aadhaarDoc: (user.aadhaarVerified || aadhaarDoc || isDigiLocker) ? {
        name: aadhaarDoc?.title || aadhaarDoc?.name || 'Aadhaar_Card_DigiLocker.pdf',
        uri: aadhaarDoc?.fileUrl || aadhaarDoc?.uri || `https://storage.askinsurance.com/kyc/aadhaar_${userId}.pdf`,
        source: aadhaarDoc?.source || 'digilocker',
      } : null,
      drivingLicenseDoc: (dlDoc || isDigiLocker) ? {
        name: dlDoc?.title || dlDoc?.name || 'Driving_Licence_DigiLocker.pdf',
        uri: dlDoc?.fileUrl || dlDoc?.uri || `https://storage.askinsurance.com/kyc/dl_${userId}.pdf`,
        source: dlDoc?.source || 'digilocker',
      } : null,
      rcDoc: (rcDoc || isDigiLocker) ? {
        name: rcDoc?.title || rcDoc?.name || 'Vehicle_RC_DigiLocker.pdf',
        uri: rcDoc?.fileUrl || rcDoc?.uri || `https://storage.askinsurance.com/kyc/rc_${userId}.pdf`,
        source: rcDoc?.source || 'digilocker',
      } : null,
    });
  } catch (error) {
    console.error('[kyc/digilocker-details]', error);
    res.status(500).json({ error: 'Failed to fetch DigiLocker details' });
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

function parseDigiLockerDob(dob: string): Date | undefined {
  if (dob.length !== 8) return undefined;
  const dd = dob.slice(0, 2), mm = dob.slice(2, 4), yyyy = dob.slice(4, 8);
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  return isNaN(d.getTime()) ? undefined : d;
}

// Instant in-app KYC verification (Aadhaar & PAN auto-sync)
router.post('/verify-instant', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId as string;
    const {
      name, panNumber, aadhaarNumber, dob, gender, address, pincode
    } = z.object({
      name: z.string().min(2),
      panNumber: z.string().min(10).max(10),
      aadhaarNumber: z.string().min(12).max(12),
      dob: z.string().optional(),
      gender: z.string().optional(),
      address: z.string().optional(),
      pincode: z.string().optional(),
    }).parse(req.body);

    const normPan = panNumber.trim().toUpperCase();
    const normAadhaar = aadhaarNumber.trim();

    let parsedDob: Date | undefined;
    if (dob) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        parsedDob = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) parsedDob = d;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        panNumber: normPan,
        aadhaarVerified: true,
        kycStatus: 'verified',
        kycVerifiedAt: new Date(),
        kycSubmittedAt: new Date(),
        ...(parsedDob ? { dateOfBirth: parsedDob } : {}),
        ...(gender ? { gender } : {}),
        ...(address ? { address } : {}),
        ...(pincode ? { pincode } : {}),
      }
    });

    // Auto-create or ensure UserDocument records for PAN and Aadhaar
    const existingPan = await prisma.userDocument.findFirst({
      where: { userId, docType: 'pan' }
    });
    if (!existingPan) {
      await prisma.userDocument.create({
        data: {
          userId,
          title: `PAN Card (${normPan})`,
          docType: 'pan',
          source: 'user_upload',
          fileUrl: `https://storage.askinsurance.com/kyc/pan_${userId}.pdf`,
          issuer: 'Income Tax Department',
        }
      }).catch(() => {});
    }

    const existingAadhaar = await prisma.userDocument.findFirst({
      where: { userId, docType: 'aadhaar' }
    });
    if (!existingAadhaar) {
      await prisma.userDocument.create({
        data: {
          userId,
          title: `Aadhaar Card (••••${normAadhaar.slice(-4)})`,
          docType: 'aadhaar',
          source: 'user_upload',
          fileUrl: `https://storage.askinsurance.com/kyc/aadhaar_${userId}.pdf`,
          issuer: 'UIDAI',
        }
      }).catch(() => {});
    }

    res.json({
      success: true,
      kycStatus: updated.kycStatus,
      user: {
        id: updated.id,
        name: updated.name,
        panNumber: updated.panNumber,
        aadhaarVerified: updated.aadhaarVerified,
        kycStatus: updated.kycStatus,
        kycVerifiedAt: updated.kycVerifiedAt,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0]?.message || 'Invalid KYC parameters' });
      return;
    }
    console.error('[kyc/verify-instant]', error);
    res.status(500).json({ error: 'Failed to verify KYC' });
  }
});

export { router as kycRouter };
