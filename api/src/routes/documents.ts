import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { uploadToR2, r2KeyFromUrl, deleteFromR2 } from '../lib/r2';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// ── GET /documents ────────────────────────────────────────────────────────────
// Fetch DigiLocker issued files + custom uploaded files for customer or agent
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const adminId = (req as any).adminId as string | undefined;

    if (!userId && !adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (userId) {
      const user = await (prisma.user as any).findUnique({
        where: { id: userId },
        select: {
          kycStatus: true,
          digilockerSub: true,
          kycDocuments: true,
          kycVerifiedAt: true,
          userDocuments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const digilockerDocs = Array.isArray(user.kycDocuments) ? (user.kycDocuments as any[]) : [];

      res.json({
        digilockerLinked: Boolean(user.digilockerSub || user.kycStatus === 'verified'),
        kycStatus: user.kycStatus,
        digilockerVerifiedAt: user.kycVerifiedAt,
        digilockerDocuments: digilockerDocs,
        uploadedDocuments: user.userDocuments ?? [],
      });
      return;
    }

    if (adminId) {
      const admin = await (prisma.admin as any).findUnique({
        where: { id: adminId },
        select: {
          kycStatus: true,
          digilockerSub: true,
          kycDocuments: true,
          kycVerifiedAt: true,
          userDocuments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!admin) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      const digilockerDocs = Array.isArray(admin.kycDocuments) ? (admin.kycDocuments as any[]) : [];

      res.json({
        digilockerLinked: Boolean(admin.digilockerSub || admin.kycStatus === 'verified'),
        kycStatus: admin.kycStatus,
        digilockerVerifiedAt: admin.kycVerifiedAt,
        digilockerDocuments: digilockerDocs,
        uploadedDocuments: admin.userDocuments ?? [],
      });
      return;
    }
  } catch (error) {
    console.error('[documents/list]', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ── POST /documents/upload ───────────────────────────────────────────────────
// Upload custom file to personal cloud storage (R2)
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const adminId = (req as any).adminId as string | undefined;
    const file = req.file;

    if (!adminId) {
      res.status(403).json({ error: 'Custom file uploads are restricted to agents and admins. Customers access files via DigiLocker.' });
      return;
    }

    if (!file) {
      res.status(400).json({ error: 'No file provided for upload.' });
      return;
    }

    const title = (req.body.title as string | undefined)?.trim() || file.originalname;
    const docType = (req.body.docType as string | undefined) || 'custom';

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ownerPrefix = userId ? `users/${userId}` : `agents/${adminId}`;
    const key = `storage/${ownerPrefix}/${Date.now()}_${safeName}`;

    const fileUrl = await uploadToR2(key, file.buffer, file.mimetype);

    const doc = await (prisma as any).userDocument.create({
      data: {
        title,
        docType,
        source: 'user_upload',
        fileUrl,
        fileKey: key,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        userId: userId ?? null,
        adminId: adminId ?? null,
      },
    });

    res.json({
      success: true,
      document: {
        ...doc,
        fileSize: Number(doc.fileSize ?? 0),
      },
    });
  } catch (error) {
    console.error('[documents/upload]', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
});

// ── DELETE /documents/:id ────────────────────────────────────────────────────
// Delete a custom uploaded file
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const adminId = (req as any).adminId as string | undefined;
    const { id } = req.params;

    if (!userId && !adminId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const doc = await (prisma as any).userDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    if (userId && doc.userId !== userId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    if (adminId && doc.adminId !== adminId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    if (doc.fileKey) {
      await deleteFromR2(doc.fileKey).catch(() => {});
    }

    await (prisma as any).userDocument.delete({ where: { id } });

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[documents/delete]', error);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export { router as documentsRouter };
