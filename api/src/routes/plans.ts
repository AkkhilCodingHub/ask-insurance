import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/plans — list active plans with pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const type     = typeof req.query.type   === 'string' ? req.query.type   : undefined;
    const search   = typeof req.query.search === 'string' ? req.query.search : undefined;
    const featured = req.query.featured === 'true' ? true : undefined;
    const page     = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip     = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(type     ? { type }          : {}),
      ...(featured ? { isFeatured: true } : {}),
      ...(search   ? {
        OR: [
          { name:        { contains: search } },
          { description: { contains: search } },
          { insurer:     { name: { contains: search } } }
        ]
      } : {})
    };

    const include = {
      insurer: {
        select: {
          id: true, name: true, shortName: true,
          brandColor: true, claimsRatio: true, rating: true, logo: true
        }
      }
    };

    const orderBy: any[] = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({ where, include, orderBy, skip, take: limit }),
      prisma.plan.count({ where })
    ]);

    res.json({ plans, total, page, limit, hasMore: skip + plans.length < total });
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
