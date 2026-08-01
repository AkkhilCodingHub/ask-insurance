import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireKyc } from '../middleware/auth';

const router = Router();

const paramsSchema = z.object({ id: z.string().min(1) });

const createClaimSchema = z.object({
  policyId: z.string().min(1),
  type: z.string().min(3),
  amount: z.number().positive(),
  description: z.string().min(10),
  incidentDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid incident date'
  })
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const claims = await prisma.claim.findMany({
      where: { userId },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            type: true,
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ claims });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const { id } = paramsSchema.parse(req.params);
    const claim = await prisma.claim.findFirst({
      where: {
        id,
        userId
      },
      include: {
        policy: true
      }
    });

    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    res.json({ claim });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid claim id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, requireKyc, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const { policyId, type, amount, description, incidentDate } = createClaimSchema.parse(req.body);

    const policy = await prisma.policy.findFirst({
      where: {
        id: policyId,
        userId
      }
    });

    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    const claim = await prisma.claim.create({
      data: {
        claimNumber: `CLM${Date.now()}`,
        type,
        amount,
        description,
        incidentDate: new Date(incidentDate),
        userId,
        policyId
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            type: true,
            provider: true
          }
        }
      }
    });

    res.status(201).json({ claim });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as claimsRouter };