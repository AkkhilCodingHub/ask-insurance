import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/plans — list active plans (public, optionally authenticated)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const type   = typeof req.query.type   === 'string' ? req.query.type   : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const featured = req.query.featured === 'true' ? true : undefined;

    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        ...(type     ? { type }                                                           : {}),
        ...(featured ? { isFeatured: true }                                              : {}),
        ...(search   ? {
          OR: [
            { name:        { contains: search } },
            { description: { contains: search } },
            { insurer:     { name: { contains: search } } }
          ]
        } : {})
      },
      include: {
        insurer: {
          select: {
            id: true, name: true, shortName: true,
            brandColor: true, claimsRatio: true, rating: true, logo: true
          }
        }
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({ plans });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// GET /api/plans/:id — single plan details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);

    const plan = await prisma.plan.findFirst({
      where: { id, isActive: true },
      include: {
        insurer: {
          select: {
            id: true, name: true, shortName: true,
            brandColor: true, claimsRatio: true, rating: true, logo: true, tagline: true
          }
        }
      }
    });

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    res.json({ plan });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as plansRouter };
