import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireKyc } from '../middleware/auth';
import { normalizeRegNumber } from './vehicles';
import { calculateLiveProviderQuotes } from '../lib/providerQuoteEngine';

const router = Router();

const paramsSchema = z.object({ id: z.string().min(1) });

const createPolicySchema = z.object({
  type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business', 'liability', 'marine', 'fire']).or(z.string()),
  provider: z.string().min(2),
  sumInsured: z.number().positive(),
  premium: z.number().nonnegative(),
  registrationNumber: z.string().optional().transform((val) => val ? normalizeRegNumber(val) : undefined),
  durationDays: z.number().int().positive().optional(),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
});
// POST /api/policies/live-quotes - Fetch live provider policy quotes & PolicyBazaar IDV calculation
router.post('/live-quotes', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body || {};
    const result = calculateLiveProviderQuotes(payload);
    res.json(result);
    return;
  } catch (error) {
    console.error('Error calculating live provider quotes:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// GET /api/policies/vehicle/:registrationNumber - List multi-class policies for a specific vehicle registration number
router.get('/vehicle/:registrationNumber', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const regNum = normalizeRegNumber(req.params.registrationNumber as string);

    if (!regNum) {
      res.status(400).json({ error: 'Valid registration number required' });
      return;
    }

    const policies = await prisma.policy.findMany({
      where: {
        userId,
        registrationNumber: { contains: regNum }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        claims: true,
        renewal: true
      }
    });

    res.json({ registrationNumber: regNum, count: policies.length, policies });
  } catch (error) {
    console.error('Error fetching vehicle policies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const policies = await prisma.policy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        claims: {
          select: {
            id: true,
            claimNumber: true,
            type: true,
            amount: true,
            status: true,
            submittedDate: true
          }
        }
      }
    });

    res.json({ policies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { generatePolicyCertificateHtml } from '../lib/certificateGenerator';

router.get('/:id/certificate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = paramsSchema.parse(req.params);
    const policy = await prisma.policy.findFirst({
      where: { id },
      include: {
        user: { select: { name: true, phone: true, email: true, address: true, customerCode: true } }
      }
    });

    if (!policy) {
      res.status(404).send('Policy certificate not found');
      return;
    }

    const html = generatePolicyCertificateHtml({
      policyNumber: policy.policyNumber,
      type: policy.type,
      provider: policy.provider,
      sumInsured: policy.sumInsured,
      premium: policy.premium,
      startDate: policy.startDate,
      endDate: policy.endDate,
      paymentStatus: policy.paymentStatus,
      registrationNumber: policy.registrationNumber,
      userName: policy.user?.name,
      userPhone: policy.user?.phone,
      userEmail: policy.user?.email || undefined,
      userAddress: policy.user?.address || undefined,
      customerCode: policy.user?.customerCode || undefined,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating policy certificate:', error);
    res.status(500).send('Error generating certificate');
  }
});

router.post('/', authenticate, requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const payload = createPolicySchema.parse(req.body);
    const now = new Date();
    const durationDays = payload.durationDays ?? 365;

    // If PAN and Aadhaar are provided, ensure KYC is marked verified & documents created
    if (payload.panNumber && payload.aadhaarNumber) {
      const normPan = payload.panNumber.trim().toUpperCase();
      const normAadhaar = payload.aadhaarNumber.replace(/\D/g, '');
      if (normPan.length === 10 && normAadhaar.length >= 12) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            panNumber: normPan,
            aadhaarVerified: true,
            kycStatus: 'verified',
            kycVerifiedAt: new Date(),
            kycSubmittedAt: new Date(),
          }
        }).catch(() => {});

        const existingPan = await prisma.userDocument.findFirst({ where: { userId, docType: 'pan' } });
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

        const existingAadhaar = await prisma.userDocument.findFirst({ where: { userId, docType: 'aadhaar' } });
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
      }
    }

    const policy = await prisma.policy.create({
      data: {
        policyNumber: `POL${Date.now()}`,
        type: payload.type,
        provider: payload.provider,
        sumInsured: payload.sumInsured,
        premium: payload.premium,
        registrationNumber: payload.registrationNumber ?? null,
        startDate: now,
        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
        userId
      }
    });

    res.status(201).json({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/cancel', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = paramsSchema.parse(req.params);

    const policy = await prisma.policy.findFirst({ where: { id, userId } });
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (policy.status !== 'active') {
      res.status(400).json({ error: `Policy is already ${policy.status}` });
      return;
    }

    const updated = await prisma.policy.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() }
    });

    res.json({ policy: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid policy id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/renew', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = paramsSchema.parse(req.params);
    const renewSchema = z.object({ durationDays: z.number().int().positive().optional() });
    const { durationDays = 365 } = renewSchema.parse(req.body);

    const policy = await prisma.policy.findFirst({ where: { id, userId } });
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }
    if (policy.status === 'cancelled') {
      res.status(400).json({ error: 'Cancelled policies cannot be renewed' });
      return;
    }

    const baseDate = policy.endDate > new Date() ? policy.endDate : new Date();
    const updated = await prisma.policy.update({
      where: { id },
      data: {
        status: 'active',
        endDate: new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000),
        paymentStatus: 'pending'
      }
    });

    res.json({ policy: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as policiesRouter };