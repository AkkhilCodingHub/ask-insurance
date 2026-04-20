import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { createAuthToken, verifyAuthToken } from '../lib/jwt';
import { sendPush } from '../lib/push';

const router = Router();

// ── Admin auth middleware ──────────────────────────────────────────────────────
const adminAuthenticate = async (req: Request, res: Response, next: () => void): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const decoded = verifyAuthToken(token);
    const admin = await prisma.admin.findFirst({
      where: { id: decoded.userId, isActive: true }
    });
    if (!admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    (req as Request & { adminId: string; adminRole: string }).adminId = admin.id;
    (req as Request & { adminId: string; adminRole: string }).adminRole = admin.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Auth ───────────────────────────────────────────────────────────────────────
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = createAuthToken({ userId: admin.id, phone: admin.email });

    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    });
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

// ── Users ──────────────────────────────────────────────────────────────────────
router.get('/users', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          city: true,
          state: true,
          createdAt: true,
          _count: { select: { policies: true, claims: true } }
        }
      }),
      prisma.user.count()
    ]);

    res.json({ users, total, page, limit });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Policies ───────────────────────────────────────────────────────────────────
router.get('/policies', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const wherePolicy = status ? { status } : {};
    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        skip,
        take: limit,
        where: wherePolicy,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          _count: { select: { claims: true } }
        }
      }),
      prisma.policy.count({ where: wherePolicy })
    ]);

    res.json({ policies, total, page, limit });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Claims ─────────────────────────────────────────────────────────────────────
router.get('/claims', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClaim = status ? { status } : {};
    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        skip,
        take: limit,
        where: whereClaim,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          policy: { select: { id: true, policyNumber: true, type: true, provider: true } }
        }
      }),
      prisma.claim.count({ where: whereClaim })
    ]);

    res.json({ claims, total, page, limit });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.put('/claims/:id/status', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { status, notes } = z
      .object({
        status: z.enum(['pending', 'approved', 'rejected', 'paid']),
        notes: z.string().optional()
      })
      .parse(req.body);

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    const now = new Date();
    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {}),
        ...(status === 'approved' ? { approvedDate: now } : {}),
        ...(status === 'paid' ? { paidDate: now } : {})
      }
    });

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type: 'claim_update',
        title: `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        body: `Your claim ${claim.claimNumber} has been ${status}.${notes ? ` Note: ${notes}` : ''}`
      }
    });

    const claimUser = await prisma.user.findUnique({ where: { id: claim.userId }, select: { pushToken: true } });
    await sendPush(claimUser?.pushToken, `Claim ${status.charAt(0).toUpperCase() + status.slice(1)}`, `Your claim ${claim.claimNumber} has been ${status}.`);

    res.json({ claim: updated });
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

// ── Stats ──────────────────────────────────────────────────────────────────────
router.get('/stats', adminAuthenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPolicies,
      totalClaims,
      pendingClaims,
      activePolicies,
      newUsersLastMonth,
      totalInsurers,
      totalPlans,
      totalPremium,
      totalClaimsAmount,
      approvedClaimsLastMonth,
      renewalsPending
    ] = await Promise.all([
      prisma.user.count(),
      prisma.policy.count(),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: 'pending' } }),
      prisma.policy.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.insurer.count(),
      prisma.plan.count(),
      prisma.policy.aggregate({
        _sum: { premium: true },
        where: { status: 'active' }
      }),
      prisma.claim.aggregate({
        _sum: { amount: true },
        where: { status: 'approved' }
      }),
      prisma.claim.count({
        where: {
          status: 'approved',
          approvedDate: { gte: thirtyDaysAgo }
        }
      }),
      prisma.policy.count({
        where: {
          status: 'active',
          endDate: { lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    res.json({
      totalUsers,
      totalPolicies,
      totalClaims,
      pendingClaims,
      activePolicies,
      newUsersLastMonth,
      totalInsurers,
      totalPlans,
      totalPremium: totalPremium._sum.premium || 0,
      totalClaimsAmount: totalClaimsAmount._sum.amount || 0,
      approvedClaimsLastMonth,
      renewalsPending,
      timestamp: now
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Insurers ───────────────────────────────────────────────────────────────────
router.get('/insurers', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [insurers, total] = await Promise.all([
      prisma.insurer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { plans: true, policies: true } } }
      }),
      prisma.insurer.count()
    ]);

    res.json({ insurers, total, page, limit });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.get('/insurers/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const insurer = await prisma.insurer.findUnique({
      where: { id },
      include: {
        plans: { take: 10, orderBy: { createdAt: 'desc' } },
        policies: { take: 10, orderBy: { createdAt: 'desc' }, select: { id: true, policyNumber: true, status: true } },
        _count: { select: { plans: true, policies: true } }
      }
    });

    if (!insurer) {
      res.status(404).json({ error: 'Insurer not found' });
      return;
    }

    res.json({ insurer });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid insurer id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.post('/insurers', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      shortName: z.string().min(2).max(20),
      logo: z.string().url(),
      brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
      tagline: z.string().max(200).optional(),
      founded: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
      headquarters: z.string().max(100).optional(),
      website: z.string().url().optional(),
      claimsRatio: z.number().min(0).max(100),
      rating: z.number().min(0).max(5),
      isActive: z.boolean().optional()
    });

    const parsed = schema.parse(req.body);
    const data: Record<string, unknown> = {
      name: parsed.name,
      slug: parsed.slug,
      shortName: parsed.shortName,
      logo: parsed.logo,
      brandColor: parsed.brandColor,
      claimsRatio: parsed.claimsRatio,
      rating: parsed.rating,
      isActive: parsed.isActive ?? true
    };
    if (parsed.tagline !== undefined) data.tagline = parsed.tagline;
    if (parsed.founded !== undefined) data.founded = parsed.founded;
    if (parsed.headquarters !== undefined) data.headquarters = parsed.headquarters;
    if (parsed.website !== undefined) data.website = parsed.website;

    const insurer = await prisma.insurer.create({ data: data as any });

    res.status(201).json({ insurer });
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

router.put('/insurers/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
      shortName: z.string().min(2).max(20).optional(),
      logo: z.string().url().optional(),
      brandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      tagline: z.string().max(200).optional(),
      founded: z.number().int().min(1900).optional(),
      headquarters: z.string().max(100).optional(),
      website: z.string().url().optional(),
      claimsRatio: z.number().min(0).max(100).optional(),
      rating: z.number().min(0).max(5).optional(),
      isActive: z.boolean().optional()
    });

    const parsed = schema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.slug !== undefined) data.slug = parsed.slug;
    if (parsed.shortName !== undefined) data.shortName = parsed.shortName;
    if (parsed.logo !== undefined) data.logo = parsed.logo;
    if (parsed.brandColor !== undefined) data.brandColor = parsed.brandColor;
    if (parsed.tagline !== undefined) data.tagline = parsed.tagline;
    if (parsed.founded !== undefined) data.founded = parsed.founded;
    if (parsed.headquarters !== undefined) data.headquarters = parsed.headquarters;
    if (parsed.website !== undefined) data.website = parsed.website;
    if (parsed.claimsRatio !== undefined) data.claimsRatio = parsed.claimsRatio;
    if (parsed.rating !== undefined) data.rating = parsed.rating;
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive;

    const insurer = await prisma.insurer.update({
      where: { id },
      data: data as any
    });

    res.json({ insurer });
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

router.delete('/insurers/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    await prisma.insurer.delete({ where: { id } });

    res.json({ success: true, message: 'Insurer deleted' });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid insurer id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Plans ──────────────────────────────────────────────────────────────────────
router.get('/plans', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const insurerId = req.query.insurerId as string | undefined;

    const wherePlan = insurerId ? { insurerId } : {};
    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        skip,
        take: limit,
        where: wherePlan,
        orderBy: { createdAt: 'desc' },
        include: {
          insurer: { select: { id: true, name: true, shortName: true } },
          _count: { select: { policies: true } }
        }
      }),
      prisma.plan.count({ where: wherePlan })
    ]);

    res.json({ plans, total, page, limit });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.post('/plans', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      insurerId: z.string().cuid(),
      type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']),
      description: z.string().min(10),
      features: z.array(z.string()),
      minAge: z.number().int().min(0).optional(),
      maxAge: z.number().int().max(150).optional(),
      minCover: z.number().positive(),
      maxCover: z.number().positive(),
      basePremium: z.number().positive(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional()
    });

    const parsed = schema.parse(req.body);
    const data: Record<string, unknown> = {
      name: parsed.name,
      slug: parsed.slug,
      insurerId: parsed.insurerId,
      type: parsed.type,
      description: parsed.description,
      features: JSON.stringify(parsed.features),
      minCover: parsed.minCover,
      maxCover: parsed.maxCover,
      basePremium: parsed.basePremium,
      isFeatured: parsed.isFeatured ?? false,
      isActive: parsed.isActive ?? true
    };
    if (parsed.minAge !== undefined) data.minAge = parsed.minAge;
    if (parsed.maxAge !== undefined) data.maxAge = parsed.maxAge;

    const plan = await prisma.plan.create({
      data: data as any,
      include: { insurer: { select: { name: true } } }
    });

    res.status(201).json({ plan });
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

router.put('/plans/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
      type: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']).optional(),
      description: z.string().min(10).optional(),
      features: z.array(z.string()).optional(),
      minAge: z.number().int().min(0).optional(),
      maxAge: z.number().int().max(150).optional(),
      minCover: z.number().positive().optional(),
      maxCover: z.number().positive().optional(),
      basePremium: z.number().positive().optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional()
    });

    const updateData = schema.parse(req.body);
    const data: Record<string, unknown> = { ...updateData };
    if (updateData.features) {
      data.features = JSON.stringify(updateData.features);
    }

    const plan = await prisma.plan.update({
      where: { id },
      data
    });

    res.json({ plan });
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

router.delete('/plans/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    await prisma.plan.delete({ where: { id } });

    res.json({ success: true, message: 'Plan deleted' });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid plan id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── User Detail ────────────────────────────────────────────────────────────────
router.get('/users/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        policies: { orderBy: { createdAt: 'desc' }, take: 5 },
        claims: { orderBy: { createdAt: 'desc' }, take: 5 },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { policies: true, claims: true, payments: true } }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── User Search ────────────────────────────────────────────────────────────────
router.get('/users/search/:query', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = z.object({ query: z.string().min(1).max(50) }).parse(req.params);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } }
        ]
      },
      take: 20,
      select: { id: true, phone: true, name: true, email: true, createdAt: true }
    });

    res.json({ users });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid search query' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Policy Details & Update ────────────────────────────────────────────────────
router.get('/policies/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        insurer: true,
        plan: true,
        claims: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } }
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
      res.status(400).json({ error: 'Invalid policy id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.put('/policies/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const schema = z.object({
      status: z.enum(['active', 'expired', 'cancelled']).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
      provider: z.string().optional(),
      sumInsured: z.number().positive().optional(),
      premium: z.number().nonnegative().optional()
    });

    const parsed = schema.parse(req.body);
    const data: Record<string, unknown> = {};
    if (parsed.status !== undefined) data.status = parsed.status;
    if (parsed.paymentStatus !== undefined) data.paymentStatus = parsed.paymentStatus;
    if (parsed.provider !== undefined) data.provider = parsed.provider;
    if (parsed.sumInsured !== undefined) data.sumInsured = parsed.sumInsured;
    if (parsed.premium !== undefined) data.premium = parsed.premium;
    if (parsed.status === 'cancelled') data.cancelledAt = new Date();

    const policy = await prisma.policy.update({
      where: { id },
      data: data as any
    });

    res.json({ policy });
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

router.delete('/policies/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    await prisma.policy.delete({ where: { id } });

    res.json({ success: true, message: 'Policy deleted' });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid policy id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Quotes (admin view) ───────────────────────────────────────────────────────
router.get('/quotes', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(['pending', 'responded', 'approved', 'converted', 'expired']).optional()
    });
    const { page, limit, status } = schema.parse(req.query);
    const skip = (page - 1) * limit;

    const whereStatus = status ? { status } : {};

    const [rawQuotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: whereStatus,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } }
        }
      }),
      prisma.quote.count({ where: whereStatus })
    ]);

    // Parse JSON fields so the frontend gets typed objects, not raw strings
    const quotes = rawQuotes.map(q => ({
      ...q,
      adminResponse: q.adminResponse ? (() => { try { return JSON.parse(q.adminResponse as string); } catch { return null; } })() : null,
    }));

    res.json({ quotes, total, page, limit });
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

// ── Admin: respond to a quote request ────────────────────────────────────────
router.post('/quotes/:id/respond', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const respondSchema = z.object({
      insurer:      z.string().min(1),
      planName:     z.string().min(1),
      netPremium:   z.number().positive(),
      gst:          z.number().min(0),
      totalPremium: z.number().positive(),
      notes:        z.string().optional(),
    });
    const data = respondSchema.parse(req.body);

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }
    if (!['pending', 'responded'].includes(quote.status)) {
      res.status(400).json({ error: 'Quote cannot be updated at this stage' }); return;
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        adminResponse:   JSON.stringify(data),
        adminResponseAt: new Date(),
        status:          'responded',
      },
      include: { user: { select: { id: true, name: true, phone: true } } }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: quote.userId,
        type:   'info',
        title:  'Your Quote is Ready!',
        body:   `We've received a quote for your ${quote.type} insurance from ${data.insurer}. Total premium: ₹${data.totalPremium.toLocaleString('en-IN')}. Open the app to review and approve.`,
      }
    }).catch(() => {});

    const quoteUser = await prisma.user.findUnique({ where: { id: quote.userId }, select: { pushToken: true } });
    await sendPush(quoteUser?.pushToken, 'Your Quote is Ready!', `${data.insurer} quote: ₹${data.totalPremium.toLocaleString('en-IN')}/yr. Open app to review.`);

    res.json({ quote: updated });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.errors?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: manually update a quote's status ───────────────────────────────────
router.patch('/quotes/:id/status', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { status } = z.object({
      status: z.enum(['pending', 'responded', 'approved', 'expired'])
    }).parse(req.body);

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }

    const updated = await prisma.quote.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, phone: true, email: true } } }
    });

    // Notify customer on meaningful status changes
    if (status === 'expired') {
      await prisma.notification.create({
        data: {
          userId: quote.userId,
          type:   'warning',
          title:  'Quote Request Expired',
          body:   `Your ${quote.type} insurance quote request has expired. Please submit a new request to get a fresh quote.`,
        }
      }).catch(() => {});
      const quoteUser = await prisma.user.findUnique({ where: { id: quote.userId }, select: { pushToken: true } });
      await sendPush(quoteUser?.pushToken, 'Quote Expired', `Your ${quote.type} insurance quote request has expired.`);
    }

    const parsed = {
      ...updated,
      adminResponse: updated.adminResponse ? (() => { try { return JSON.parse(updated.adminResponse as string); } catch { return null; } })() : null,
    };
    res.json({ quote: parsed });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.errors?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: generate Razorpay payment link for an approved quote ───────────────
router.post('/quotes/:id/payment-link', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true } },
        policies: { where: { paymentStatus: 'pending' }, take: 1, select: { id: true, policyNumber: true, premium: true, type: true, provider: true } }
      }
    });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }
    if (quote.status !== 'approved') { res.status(400).json({ error: 'Quote must be approved before payment link can be generated' }); return; }

    const policy = quote.policies[0];
    if (!policy) { res.status(404).json({ error: 'No pending policy found for this quote' }); return; }

    const { createPaymentLink } = await import('../lib/razorpay');
    const link = await createPaymentLink({
      amount:        policy.premium,
      policyId:      policy.id,
      policyNumber:  policy.policyNumber,
      customerName:  quote.user?.name ?? 'Customer',
      customerPhone: quote.user?.phone ?? '',
      description:   `${policy.type} Insurance Premium — ${policy.provider}`,
    });

    res.json({ paymentUrl: link.short_url, paymentLinkId: link.id, amount: policy.premium });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// ── Admin: confirm payment + upload policy document ───────────────────────────
router.post('/policies/:id/confirm-payment', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const schema = z.object({
      documentUrl:  z.string().url().optional(),
      providerRef:  z.string().optional(),
      notes:        z.string().optional(),
    });
    const { documentUrl, providerRef, notes } = schema.parse(req.body);

    const policy = await prisma.policy.findUnique({ where: { id } });
    if (!policy) { res.status(404).json({ error: 'Policy not found' }); return; }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.policy.update({
        where: { id },
        data: {
          status:        'active',
          paymentStatus: 'paid',
          documentUrl:   documentUrl ?? policy.documentUrl,
          notes:         notes ?? policy.notes,
        }
      });

      // Create payment record
      await tx.payment.create({
        data: {
          amount:      policy.premium,
          currency:    'INR',
          status:      'success',
          provider:    'manual',
          providerRef: providerRef ?? `MANUAL-${Date.now()}`,
          policyId:    id,
          userId:      policy.userId,
        }
      });

      return p;
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: policy.userId,
        type:   'info',
        title:  'Payment Confirmed — Policy Active!',
        body:   `Your ${policy.type} policy (${policy.policyNumber}) is now active.${documentUrl ? ' Your policy document is available in the app.' : ''}`,
      }
    }).catch(() => {});

    const policyUser = await prisma.user.findUnique({ where: { id: policy.userId }, select: { pushToken: true } });
    await sendPush(policyUser?.pushToken, 'Policy Activated!', 'Your payment was confirmed. Your policy is now active. Check My Policies.');

    res.json({ policy: updated });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.errors?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', adminAuthenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // By-type premium breakdown
    const byTypePolicies = await prisma.policy.groupBy({
      by: ['type'],
      _sum: { premium: true },
      _count: { id: true }
    });

    // Monthly policies created (last 12 months)
    const allPolicies = await prisma.policy.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, premium: true, status: true }
    });

    // Monthly claims (last 12 months)
    const allClaims = await prisma.claim.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, amount: true, status: true }
    });

    // Build monthly buckets
    const months: { label: string; policies: number; premium: number; claims: number; claimsAmount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const policiesInMonth = allPolicies.filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      });
      const claimsInMonth = allClaims.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
      });
      months.push({
        label,
        policies: policiesInMonth.length,
        premium: policiesInMonth.reduce((s, p) => s + (p.premium ?? 0), 0),
        claims: claimsInMonth.length,
        claimsAmount: claimsInMonth.reduce((s, c) => s + (c.amount ?? 0), 0)
      });
    }

    // Top plans by policy count
    const topPlans = await prisma.plan.findMany({
      take: 5,
      orderBy: { policies: { _count: 'desc' } },
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { policies: true } }
      }
    });

    // Top insurers by premium
    const topInsurerPolicies = await prisma.policy.groupBy({
      by: ['insurerId'],
      _sum: { premium: true },
      _count: { id: true },
      orderBy: { _sum: { premium: 'desc' } },
      take: 5
    });

    const insurerIds = topInsurerPolicies
      .map((p) => p.insurerId)
      .filter((id): id is string => id !== null);

    const insurers = await prisma.insurer.findMany({
      where: { id: { in: insurerIds } },
      select: { id: true, name: true, shortName: true }
    });

    const topInsurers = topInsurerPolicies.map((p) => ({
      insurerId: p.insurerId,
      name: insurers.find((i) => i.id === p.insurerId)?.name ?? 'Unknown',
      shortName: insurers.find((i) => i.id === p.insurerId)?.shortName ?? '',
      premium: p._sum.premium ?? 0,
      policies: p._count.id
    }));

    res.json({
      byType: byTypePolicies.map((r) => ({
        type: r.type,
        policies: r._count.id,
        premium: r._sum.premium ?? 0
      })),
      monthly: months,
      topPlans,
      topInsurers
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Chat: Conversations ───────────────────────────────────────────────────────

router.get('/chat/conversations', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      page:   z.coerce.number().int().min(1).default(1),
      limit:  z.coerce.number().int().min(1).max(100).default(30),
      status: z.enum(['open', 'closed']).optional()
    });
    const { page, limit, status } = schema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          admin: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, content: true, senderType: true, createdAt: true, readAt: true }
          },
          _count: {
            select: { messages: true }
          }
        }
      }),
      prisma.conversation.count({ where })
    ]);

    // Attach unread count (messages from user not yet read)
    const withUnread = conversations.map(c => ({
      ...c,
      unreadCount: 0 // computed below per conversation via separate query would be too slow; client can derive
    }));

    res.json({ conversations: withUnread, total, page, limit });
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

router.get('/chat/conversations/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        admin: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Mark all unread user messages as read
    await prisma.message.updateMany({
      where: { conversationId: id, senderType: 'user', readAt: null },
      data: { readAt: new Date() }
    });

    res.json({ conversation });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid conversation id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.post('/chat/conversations', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as Request & { adminId: string };
    const schema = z.object({
      userId:  z.string().cuid(),
      subject: z.string().max(200).optional()
    });
    const { userId, subject } = schema.parse(req.body);

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Reopen existing open conversation or create new
    const existing = await prisma.conversation.findFirst({
      where: { userId, status: 'open' },
      include: { messages: { orderBy: { createdAt: 'asc' } }, user: { select: { id: true, name: true, phone: true, email: true } }, admin: { select: { id: true, name: true } } }
    });

    if (existing) {
      res.json({ conversation: existing });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: { userId, adminId: adminReq.adminId, subject: subject ?? null, status: 'open' },
      include: { user: { select: { id: true, name: true, phone: true, email: true } }, admin: { select: { id: true, name: true } }, messages: true }
    });

    res.status(201).json({ conversation });
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

router.post('/chat/conversations/:id/messages', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminReq = req as Request & { adminId: string };
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { content } = z.object({ content: z.string().min(1).max(4000) }).parse(req.body);

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    if (conversation.status === 'closed') {
      res.status(400).json({ error: 'Conversation is closed' });
      return;
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, content, senderType: 'admin', senderId: adminReq.adminId }
      }),
      prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date(), adminId: adminReq.adminId }
      })
    ]);

    const recipient = await prisma.user.findUnique({
      where: { id: conversation.userId },
      select: { pushToken: true },
    });
    const preview = content.length > 140 ? `${content.slice(0, 137)}…` : content;
    await sendPush(recipient?.pushToken ?? null, 'Support', preview, {
      type: 'chat',
      conversationId: id,
      category: 'chat',
    });

    res.status(201).json({ message });
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

// Poll for new messages since a timestamp
router.get('/chat/conversations/:id/messages', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const after = req.query.after ? new Date(req.query.after as string) : undefined;

    const messages = await prisma.message.findMany({
      where: { conversationId: id, ...(after ? { createdAt: { gt: after } } : {}) },
      orderBy: { createdAt: 'asc' }
    });

    // Mark newly fetched user messages as read
    const unreadUserIds = messages.filter(m => m.senderType === 'user' && !m.readAt).map(m => m.id);
    if (unreadUserIds.length > 0) {
      await prisma.message.updateMany({ where: { id: { in: unreadUserIds } }, data: { readAt: new Date() } });
    }

    res.json({ messages });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid conversation id' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.put('/chat/conversations/:id/status', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { status } = z.object({ status: z.enum(['open', 'closed']) }).parse(req.body);

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, name: true, phone: true, email: true } }, admin: { select: { id: true, name: true } } }
    });

    res.json({ conversation });
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

// POST /api/admin/policies/:id/generate-payment-link
router.post('/policies/:id/generate-payment-link', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true } } }
    });
    if (!policy) { res.status(404).json({ error: 'Policy not found' }); return; }
    if (policy.paymentStatus === 'paid') { res.status(400).json({ error: 'Policy already paid' }); return; }

    const { createPaymentLink } = await import('../lib/razorpay');
    const link = await createPaymentLink({
      amount: policy.premium,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      customerName: policy.user?.name ?? 'Customer',
      customerPhone: policy.user?.phone ?? '',
      description: `${policy.type} Insurance — ${policy.provider}`,
    });

    res.json({ paymentUrl: link.short_url, paymentLinkId: link.id, amount: policy.premium });
    return;
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create payment link' });
    return;
  }
});

// Unread count for sidebar badge
router.get('/chat/unread', adminAuthenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.message.count({
      where: { senderType: 'user', readAt: null }
    });
    res.json({ unread: count });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as adminRouter };
