import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireKyc } from '../middleware/auth';
import { normalizeRegNumber } from './vehicles';
import { calculateLiveProviderQuotes } from '../lib/providerQuoteEngine';

const router = Router();

const paramsSchema = z.object({ id: z.string().min(1) });

const createPolicySchema = z.object({
  type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']),
  provider: z.string().min(2),
  sumInsured: z.number().positive(),
  premium: z.number().nonnegative(),
  registrationNumber: z.string().optional().transform((val) => val ? normalizeRegNumber(val) : undefined),
  durationDays: z.number().int().positive().optional()
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

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = paramsSchema.parse(req.params);

    const policy = await prisma.policy.findFirst({
      where: { id, userId },
      include: {
        claims: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    res.json({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid policy id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const payload = createPolicySchema.parse(req.body);
    const now = new Date();
    const durationDays = payload.durationDays ?? 365;

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