import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const endorsementSchema = z.object({
  policyId: z.string().min(1, 'Policy ID is required'),
  category: z.enum([
    'name_correction',
    'address_update',
    'nominee_change',
    'vehicle_reg_update',
    'sum_insured_change',
    'addon_addition',
    'custom'
  ]),
  type: z.enum(['financial', 'non_financial']).optional().default('non_financial'),
  requestedChanges: z.string().min(5, 'Requested changes description must be at least 5 characters')
});

// POST /api/endorsements - Submit policy endorsement request
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const payload = endorsementSchema.parse(req.body);

    // Verify policy belongs to user
    const policy = await prisma.policy.findFirst({
      where: { id: payload.policyId, userId }
    });

    if (!policy) {
      res.status(404).json({ error: 'Policy not found or access denied' });
      return;
    }

    const count = await prisma.endorsement.count();
    const endorsementNumber = `END-${Date.now().toString().slice(-5)}${count + 1}`;

    const endorsement = await prisma.endorsement.create({
      data: {
        endorsementNumber,
        type: payload.type ?? 'non_financial',
        category: payload.category,
        requestedChanges: payload.requestedChanges,
        status: 'pending',
        policyId: policy.id,
        userId
      },
      include: {
        policy: {
          select: {
            policyNumber: true,
            provider: true,
            type: true
          }
        }
      }
    });

    res.status(201).json({ endorsement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid endorsement data' });
      return;
    }
    console.error('Error creating endorsement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/endorsements - List all endorsement requests for user
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const endorsements = await prisma.endorsement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            provider: true,
            type: true
          }
        }
      }
    });

    res.json({ endorsements });
  } catch (error) {
    console.error('Error fetching endorsements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/endorsements/policy/:policyId - Get endorsement history for specific policy
router.get('/policy/:policyId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const policyId = req.params.policyId as string;

    const endorsements = await prisma.endorsement.findMany({
      where: { policyId, userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ endorsements });
  } catch (error) {
    console.error('Error fetching policy endorsements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
