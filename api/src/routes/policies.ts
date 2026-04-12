import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const paramsSchema = z.object({ id: z.string().cuid() });

const createPolicySchema = z.object({
  type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']),
  provider: z.string().min(2),
  sumInsured: z.number().positive(),
  premium: z.number().nonnegative(),
  durationDays: z.number().int().positive().optional()
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid policy id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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
        startDate: now,
        endDate: new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000),
        userId
      }
    });

    res.status(201).json({ policy });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as policiesRouter };