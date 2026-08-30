import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { createAuthToken, verifyAuthToken } from '../lib/jwt';
import { sendPush } from '../lib/push';
import { uploadToR2, deleteFromR2, r2KeyFromUrl, sanitizeFilename } from '../lib/r2';
import { logActivity } from '../lib/activity';
import { calculateAndApplyBrokerage } from '../lib/brokerage';

const SUPERADMIN_EMAILS = new Set(['neota.pvt.ltd@gmail.com', 'admin@ask-insurance.in']);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
});

const STORAGE_QUOTA_BYTES = BigInt(10) * BigInt(1024) * BigInt(1024) * BigInt(1024); // 10 GB

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

import { generateAgentId } from '../lib/idGenerator';

// ── Auth ───────────────────────────────────────────────────────────────────────
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawIdentifier = String(req.body.identifier || req.body.email || '').trim();
    const password = String(req.body.password || '').trim();

    if (!rawIdentifier || !password) {
      res.status(400).json({ error: 'Email/POSP ID and password are required' });
      return;
    }

    const uppercaseInput = rawIdentifier.toUpperCase();
    let admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: rawIdentifier.toLowerCase() },
          { agentCode: uppercaseInput },
          { agentCode: rawIdentifier },
          { agentCode: uppercaseInput.replace(/^AS-?/, 'AS') }
        ]
      }
    });

    if (!admin || !admin.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!admin.password) {
      res.status(401).json({ error: 'This account uses Google Sign-In. Please use the "Sign in with Google" button.' });
      return;
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!admin.agentCode || admin.agentCode.startsWith('AGT-')) {
      const newAgentCode = await generateAgentId();
      admin = await prisma.admin.update({
        where: { id: admin.id },
        data: { agentCode: newAgentCode }
      });
    }

    const token = createAuthToken({ userId: admin.id, phone: admin.email });

    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, agentCode: admin.agentCode }
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Google OAuth login ─────────────────────────────────────────────────────────
router.post('/auth/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = z.object({ credential: z.string().min(1) }).parse(req.body);

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: 'Google OAuth is not configured on this server.' });
      return;
    }
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    if (!ticket) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    const { email, name, sub: googleId } = payload;

    let admin = await prisma.admin.findUnique({ where: { email } });

    // Auto-create superadmin accounts on first sign-in
    if (!admin && SUPERADMIN_EMAILS.has(email)) {
      admin = await prisma.admin.create({
        data: { email, name: name ?? email, role: 'superadmin', googleId },
      });
    }

    if (!admin || !admin.isActive) {
      res.status(403).json({ error: 'Not authorised as an admin. Contact your superadmin to be added.' });
      return;
    }

    // Persist googleId on first Google login if not already stored
    if (googleId && !admin.googleId) {
      admin = await prisma.admin.update({ where: { id: admin.id }, data: { googleId } });
    }

    const token = createAuthToken({ userId: admin.id, phone: admin.email });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
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
          customerCode: true,
          phone: true,
          name: true,
          email: true,
          city: true,
          state: true,
          createdAt: true,
          agentId: true,
          agent: { select: { id: true, name: true, email: true, agentCode: true } },
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

router.post('/users/:userId/assign-agent', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { agentId } = z.object({ agentId: z.string().min(1) }).parse(req.body);

    const agent = await prisma.admin.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ error: 'POSP Agent not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { agentId },
      select: {
        id: true,
        customerCode: true,
        phone: true,
        name: true,
        email: true,
        agentId: true,
        agent: { select: { id: true, name: true, email: true, agentCode: true } }
      }
    });

    res.json({ success: true, user: updatedUser, message: `Assigned POSP ${agent.name} to user` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid agentId' });
      return;
    }
    console.error('Error assigning agent:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        status: z.enum(['pending', 'approved', 'rejected', 'paid', 'settled']),
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
        ...(status === 'paid' || status === 'settled' ? { paidDate: now } : {})
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Notifications ────────────────────────────────────────────────────────────────
router.get('/notifications', adminAuthenticate, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [pendingClaims, pendingQuotes, openConversations] = await Promise.all([
      prisma.claim.findMany({
        where: { status: 'pending' },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.quote.findMany({
        where: { status: 'pending' },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.conversation.findMany({
        where: { status: 'open' },
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    const notifications = [
      ...pendingClaims.map(c => ({
        id: `claim-${c.id}`,
        type: 'claim',
        title: 'New Claim Pending Review',
        body: `${c.user?.name || c.user?.phone || 'A user'} submitted a claim of ₹${c.amount}.`,
        link: `/dashboard/claims`,
        createdAt: c.createdAt
      })),
      ...pendingQuotes.map(q => ({
        id: `quote-${q.id}`,
        type: 'quote',
        title: 'New Quote Request',
        body: `${q.user?.name || q.user?.phone || 'A user'} requested a ${q.type} quote response.`,
        link: `/dashboard/quotes`,
        createdAt: q.createdAt
      })),
      ...openConversations.map(conv => ({
        id: `chat-${conv.id}`,
        type: 'chat',
        title: 'Open Chat Conversation',
        body: `Support chat requires response from: ${conv.user?.name || conv.user?.phone}.`,
        link: `/dashboard/chat`,
        createdAt: conv.updatedAt
      }))
    ];

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      notifications: notifications.slice(0, 15),
      unreadCount: notifications.length
    });
    return;
  } catch (error) {
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid insurer id' });
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

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'CREATE_INSURER', { id: insurer.id, name: insurer.name, slug: insurer.slug });

    res.status(201).json({ insurer });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'UPDATE_INSURER', { id: insurer.id, name: insurer.name });

    res.json({ insurer });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'DELETE_INSURER', { id });

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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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

    const adminRole = (req as any).adminRole;
    const adminId   = (req as any).adminId;

    const where: any = status ? { status } : {};
    if (adminRole === 'agent') {
      where.agentId = adminId;
    }

    const [rawQuotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          agent: { select: { id: true, name: true, email: true, agentCode: true } }
        }
      }),
      prisma.quote.count({ where })
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

// ── Admin: manually assign a quote to an agent ──────────────────────────────
router.post('/quotes/:id/assign', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { agentId } = z.object({ agentId: z.string().nullable() }).parse(req.body);

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }

    const updated = await prisma.quote.update({
      where: { id },
      data: { agentId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        agent: { select: { id: true, name: true, email: true, agentCode: true } }
      }
    });

    if (agentId) {
      await prisma.user.update({
        where: { id: quote.userId },
        data: { agentId }
      }).catch(() => {});
    }

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'ASSIGN_QUOTE', { quoteId: id, agentId });

    res.json({ quote: updated, message: 'Quote assigned successfully' });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
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
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
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
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
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
        // look for any non-paid policy (pending or otherwise) linked to this quote
        policies: { where: { paymentStatus: { not: 'paid' } }, take: 1 }
      }
    });
    if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }
    if (quote.status !== 'approved') { res.status(400).json({ error: 'Quote must be approved before a payment link can be generated' }); return; }
    if (!quote.adminResponse) { res.status(400).json({ error: 'No quote response found — send a quote first' }); return; }

    let adminResp: { insurer: string; planName: string; netPremium: number; gst: number; totalPremium: number; notes?: string };
    try { adminResp = JSON.parse(quote.adminResponse as string); } catch { res.status(400).json({ error: 'Invalid quote response data' }); return; }

    // Use existing unpaid policy, or create one if the agent approved the quote manually
    let policy = quote.policies[0];
    if (!policy) {
      let details: Record<string, unknown> = {};
      try { details = JSON.parse(quote.details as string); } catch {}
      const now = new Date();
      policy = await prisma.policy.create({
        data: {
          policyNumber:  `APP${Date.now()}`,
          type:          quote.type,
          provider:      adminResp.insurer,
          sumInsured:    (details.sumInsured as number) ?? 0,
          premium:       adminResp.totalPremium,
          startDate:     now,
          endDate:       new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          status:        'pending',
          paymentStatus: 'pending',
          notes:         adminResp.notes ?? null,
          userId:        quote.userId,
          quoteId:       quote.id,
        },
      });
    }

    const { createPaymentLink } = await import('../lib/razorpay');
    const link = await createPaymentLink({
      amount:        policy.premium,
      policyId:      policy.id,
      policyNumber:  policy.policyNumber,
      customerName:  quote.user?.name ?? 'Customer',
      customerPhone: quote.user?.phone ?? '',
      description:   `${policy.type} Insurance Premium — ${adminResp.insurer}`,
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

      // Calculate and record brokerage for the policy
      await calculateAndApplyBrokerage(tx, id);

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
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
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

    // Renewals stats
    const renewalsStats = await prisma.renewal.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const renewalsSummary = {
      total: renewalsStats.reduce((s: number, r: any) => s + r._count.id, 0),
      pending: renewalsStats.find((r: any) => r.status === 'pending')?._count.id ?? 0,
      contacted: renewalsStats.find((r: any) => r.status === 'contacted')?._count.id ?? 0,
      closed: renewalsStats.find((r: any) => r.status === 'closed')?._count.id ?? 0,
      lost: renewalsStats.find((r: any) => r.status === 'lost')?._count.id ?? 0
    };

    res.json({
      byType: byTypePolicies.map((r) => ({
        type: r.type,
        policies: r._count.id,
        premium: r._sum.premium ?? 0
      })),
      monthly: months,
      topPlans,
      topInsurers,
      renewals: renewalsSummary
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

    const adminRole = (req as any).adminRole;
    const adminId   = (req as any).adminId;

    const where: any = status ? { status } : {};
    if (adminRole === 'agent') {
      where.OR = [
        { adminId },
        { user: { agentId: adminId } }
      ];
    }

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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
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

// ── File Storage ──────────────────────────────────────────────────────────────

// GET /admin/storage — quota summary for current admin
router.get('/storage', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { storageUsed: true },
    });
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
    res.json({
      used:  Number(admin.storageUsed),
      quota: Number(STORAGE_QUOTA_BYTES),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/files — list files for current admin
router.get('/files', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.adminFile.findMany({
        where:   { adminId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminFile.count({ where: { adminId } }),
    ]);

    const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { storageUsed: true } });

    res.json({
      files: files.map(f => ({ ...f, size: Number(f.size) })),
      total,
      page,
      limit,
      storageUsed:  Number(admin?.storageUsed ?? 0),
      storageQuota: Number(STORAGE_QUOTA_BYTES),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/files/upload — upload a file to admin's storage
router.post('/files/upload', adminAuthenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) { res.status(400).json({ error: 'No file provided' }); return; }

    const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { storageUsed: true } });
    if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

    const fileSize = BigInt(file.size);
    if (admin.storageUsed + fileSize > STORAGE_QUOTA_BYTES) {
      res.status(400).json({ error: 'Storage quota exceeded (10 GB limit)' });
      return;
    }

    const safeName = sanitizeFilename(file.originalname);
    const key = `admins/${adminId}/${Date.now()}_${safeName}`;
    const url = await uploadToR2(key, file.buffer, file.mimetype);

    const [adminFile] = await prisma.$transaction([
      prisma.adminFile.create({
        data: { name: file.originalname, key, url, size: fileSize, mimeType: file.mimetype, adminId },
      }),
      prisma.admin.update({
        where: { id: adminId },
        data:  { storageUsed: { increment: fileSize } },
      }),
    ]);

    res.status(201).json({ file: { ...adminFile, size: Number(adminFile.size) } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/files/:id — delete a file
router.delete('/files/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

    const file = await prisma.adminFile.findFirst({ where: { id, adminId } });
    if (!file) { res.status(404).json({ error: 'File not found' }); return; }

    await deleteFromR2(file.key).catch(() => {/* ignore if already gone */});
    await prisma.$transaction([
      prisma.adminFile.delete({ where: { id } }),
      prisma.admin.update({
        where: { id: adminId },
        data:  { storageUsed: { decrement: file.size } },
      }),
    ]);

    res.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Invalid ID' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/policies/:id/upload-document — upload policy PDF + update metadata
router.post(
  '/policies/:id/upload-document',
  adminAuthenticate,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = (req as Request & { adminId: string }).adminId;
      const { id } = z.object({ id: z.string().cuid() }).parse(req.params);

      const schema = z.object({
        policyNumber: z.string().min(1).optional(),
        issueDate:    z.string().optional(),
        expiryDate:   z.string().optional(),
        notes:        z.string().optional(),
      });
      const { policyNumber, issueDate, expiryDate, notes } = schema.parse(req.body);

      const policy = await prisma.policy.findUnique({ where: { id } });
      if (!policy) { res.status(404).json({ error: 'Policy not found' }); return; }

      let documentUrl = policy.documentUrl;

      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (file) {
        const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { storageUsed: true } });
        if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

        const fileSize = BigInt(file.size);
        if (admin.storageUsed + fileSize > STORAGE_QUOTA_BYTES) {
          res.status(400).json({ error: 'Storage quota exceeded (10 GB limit)' });
          return;
        }

        // Delete old document from R2 if exists
        if (policy.documentUrl) {
          const oldKey = r2KeyFromUrl(policy.documentUrl);
          if (oldKey) await deleteFromR2(oldKey).catch(() => {});
        }

        const safeName = sanitizeFilename(file.originalname);
        const key = `policies/${id}/${Date.now()}_${safeName}`;
        documentUrl = await uploadToR2(key, file.buffer, file.mimetype);

        // Track storage
        await prisma.admin.update({
          where: { id: adminId },
          data:  { storageUsed: { increment: fileSize } },
        });
      }

      const parseDate = (s?: string) => { if (!s) return undefined; const d = new Date(s); return isNaN(d.getTime()) ? undefined : d; };
      const data: Prisma.PolicyUpdateInput = {};
      if (documentUrl !== undefined) data.documentUrl = documentUrl;
      if (policyNumber) data.policyNumber = policyNumber;
      const startD = parseDate(issueDate);
      if (startD) data.startDate = startD;
      const endD = parseDate(expiryDate);
      if (endD) data.endDate = endD;
      if (notes !== undefined) data.notes = notes;
      const updated = await prisma.policy.update({
        where: { id },
        data,
        include: { user: { select: { id: true, name: true, phone: true } } },
      });

      // Notify user if document was attached
      if (file) {
        await prisma.notification.create({
          data: {
            userId: policy.userId,
            type:   'info',
            title:  'Policy Document Available',
            body:   `Your ${policy.type} policy document (${updated.policyNumber}) has been uploaded. You can download it from My Policies.`,
          },
        }).catch(() => {});

        const policyUser = await prisma.user.findUnique({ where: { id: policy.userId }, select: { pushToken: true } });
        await sendPush(policyUser?.pushToken, 'Policy Document Ready', 'Your policy document has been uploaded. Tap to view it in My Policies.');
      }

      res.json({ policy: updated });
    } catch (e) {
      if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── Agent management (superadmin only) ───────────────────────────────────────

const superadminOnly = (req: Request, res: Response, next: () => void): void => {
  const role = (req as Request & { adminRole: string }).adminRole;
  if (role !== 'superadmin') {
    res.status(403).json({ error: 'Superadmin access required' });
    return;
  }
  next();
};

// GET /admin/agents — list all agents
router.get('/agents', adminAuthenticate, superadminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const agents = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, agentCode: true, isActive: true, createdAt: true, storageUsed: true,
        kycStatus: true, kycDocType: true, kycDocUrl: true, kycSubmittedAt: true, kycRejectionReason: true, kycVerifiedAt: true
      },
    });

    const updatedAgents = await Promise.all(agents.map(async (a) => {
      let code = a.agentCode;
      if (!code || code.startsWith('AGT-')) {
        code = await generateAgentId();
        await prisma.admin.update({
          where: { id: a.id },
          data: { agentCode: code }
        });
      }
      return { ...a, agentCode: code, storageUsed: Number(a.storageUsed) };
    }));

    res.json({ agents: updatedAgents });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/agents — create a new agent
router.post('/agents', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = z.object({
      name:     z.string().min(2),
      email:    z.string().email(),
      password: z.string().min(8, 'Password must be at least 8 characters').optional(),
      role:     z.enum(['agent', 'superadmin']).default('agent'),
    }).parse(req.body);

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) { res.status(409).json({ error: 'An agent with this email already exists' }); return; }

    const hashed = password ? await bcrypt.hash(password, 12) : null;
    const agentCode = await generateAgentId();
    const agent  = await prisma.admin.create({
      data: { name, email, password: hashed, role, agentCode },
      select: { id: true, name: true, email: true, role: true, agentCode: true, isActive: true, createdAt: true },
    });
    const adminId = (req as any).adminId;
    await logActivity(adminId, 'CREATE_AGENT', { id: agent.id, name: agent.name, role: agent.role });
    res.status(201).json({ agent });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /admin/agents/:id — update name / role / isActive / reset password
router.patch('/agents/:id', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const body = z.object({
      name:     z.string().min(2).optional(),
      role:     z.enum(['agent', 'superadmin']).optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(8).optional(),
    }).parse(req.body);

    const data: Record<string, unknown> = {};
    if (body.name     !== undefined) data.name     = body.name;
    if (body.role     !== undefined) data.role     = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.password !== undefined) data.password = await bcrypt.hash(body.password, 12);

    const agent = await prisma.admin.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    const adminId = (req as any).adminId;
    await logActivity(adminId, 'UPDATE_AGENT', { id: agent.id, name: agent.name, role: agent.role, isActive: agent.isActive });
    res.json({ agent });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /admin/agents/:id
router.delete('/agents/:id', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const selfId = (req as Request & { adminId: string }).adminId;
    if (id === selfId) { res.status(400).json({ error: 'You cannot delete your own account' }); return; }
    await prisma.admin.delete({ where: { id } });
    const adminId = (req as any).adminId;
    await logActivity(adminId, 'DELETE_AGENT', { id });
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/agents/kyc/upload — agent uploads official authorization letter / identity document
router.post('/agents/kyc/upload', adminAuthenticate, upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) { res.status(400).json({ error: 'No document file provided.' }); return; }

    const body = z.object({
      docType: z.enum(['appointment_letter', 'aadhaar', 'driving_license', 'passport']).default('appointment_letter'),
    }).parse(req.body);

    const safeName = sanitizeFilename(file.originalname);
    const key = `agents/${adminId}/kyc_${Date.now()}_${safeName}`;
    const docUrl = await uploadToR2(key, file.buffer, file.mimetype);

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: {
        kycDocType: body.docType,
        kycDocUrl: docUrl,
        kycStatus: 'submitted',
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
      select: { id: true, name: true, kycStatus: true, kycDocType: true, kycDocUrl: true }
    });

    res.json({ success: true, kycStatus: updated.kycStatus, docUrl: updated.kycDocUrl });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /admin/agents/:id/kyc/verify — superadmin approves or rejects agent's authorization letter
router.post('/agents/:id/kyc/verify', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { action, reason } = z.object({
      action: z.enum(['approve', 'reject']),
      reason: z.string().optional(),
    }).parse(req.body);

    const agent = await prisma.admin.findUnique({ where: { id } });
    if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }

    const isApprove = action === 'approve';
    const updated = await prisma.admin.update({
      where: { id },
      data: {
        kycStatus: isApprove ? 'verified' : 'rejected',
        kycVerifiedAt: isApprove ? new Date() : null,
        kycRejectionReason: isApprove ? null : (reason || 'Document requirements not met'),
      },
      select: { id: true, name: true, kycStatus: true }
    });

    const superadminId = (req as any).adminId;
    await logActivity(superadminId, 'VERIFY_AGENT_KYC', { agentId: id, action, kycStatus: updated.kycStatus });

    res.json({ success: true, kycStatus: updated.kycStatus });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /admin/me — fetch own profile
router.get('/me', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        kycStatus: true,
        kycDocType: true,
        kycDocUrl: true,
        kycSubmittedAt: true,
        kycRejectionReason: true,
        kycVerifiedAt: true
      }
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.json({ admin });
  } catch (e) {
    console.error('[admin/me]', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /admin/me — update own profile / password
router.put('/me', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as Request & { adminId: string }).adminId;
    const body = z.object({
      name:        z.string().min(2).optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).optional(),
    }).parse(req.body);

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;

    if (body.newPassword) {
      if (!body.currentPassword) {
        res.status(400).json({ error: 'Current password is required to set a new password' });
        return;
      }
      const admin = await prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
      if (!admin.password) { res.status(400).json({ error: 'This account uses Google Sign-In and has no password.' }); return; }
      const valid = await bcrypt.compare(body.currentPassword, admin.password);
      if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }
      data.password = await bcrypt.hash(body.newPassword, 12);
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ admin: updated });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /admin/kyc ───────────────────────────────────────────────────────────
// List users who have submitted KYC documents for review.

router.get('/kyc', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = (req.query.status as string) || 'submitted';
    const users = await prisma.user.findMany({
      where: { kycStatus: status },
      select: {
        id: true, name: true, phone: true, email: true,
        kycStatus: true, kycDocType: true, kycDocUrl: true,
        kycSubmittedAt: true, kycRejectionReason: true, kycVerifiedAt: true,
      },
      orderBy: { kycSubmittedAt: 'asc' },
    });
    res.json({ submissions: users, total: users.length });
  } catch (e) {
    console.error('[admin/kyc]', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /admin/kyc/:userId/approve ──────────────────────────────────────────

router.post('/kyc/:userId/approve', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.params);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus:          'verified',
        kycVerifiedAt:      new Date(),
        kycRejectionReason: null,
        aadhaarVerified:    user.kycDocType === 'aadhaar',
      },
    });

    if (user.pushToken) {
      sendPush(user.pushToken, 'KYC Approved!', 'Your identity has been verified. You can now access all features.').catch(() => {});
    }

    res.json({ success: true, kycStatus: 'verified' });
  } catch (e) {
    console.error('[admin/kyc/approve]', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /admin/kyc/:userId/reject ───────────────────────────────────────────

router.post('/kyc/:userId/reject', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.params);
    const { reason } = z.object({ reason: z.string().min(1).max(500) }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus:          'rejected',
        kycRejectionReason: reason,
        kycVerifiedAt:      null,
      },
    });

    if (user.pushToken) {
      sendPush(user.pushToken, 'KYC Needs Attention', `Your KYC was not approved: ${reason}`).catch(() => {});
    }

    res.json({ success: true, kycStatus: 'rejected' });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: 'Rejection reason is required.' }); return; }
    console.error('[admin/kyc/reject]', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Activity Logs ────────────────────────────────────────────────────────────
router.get('/logs', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        admin: {
          select: { name: true, email: true, role: true }
        }
      }
    });
    res.json({ logs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Brokerage configuration and tracking ──────────────────────────────────────
router.get('/brokerage/slabs', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const slabs = await prisma.brokerageSlab.findMany({
      include: { insurer: { select: { name: true } } }
    });
    res.json({ slabs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/brokerage/slabs', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { insurerId, insuranceType, percentage } = z.object({
      insurerId: z.string().cuid(),
      insuranceType: z.enum(['life', 'health', 'motor', 'travel', 'home', 'business']),
      percentage: z.number().min(0).max(100),
    }).parse(req.body);

    const slab = await prisma.brokerageSlab.upsert({
      where: {
        insurerId_insuranceType: { insurerId, insuranceType }
      },
      update: { percentage },
      create: { insurerId, insuranceType, percentage }
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'CONFIGURE_BROKERAGE', { insurerId, insuranceType, percentage });

    res.status(201).json({ slab });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/brokerage/stats', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await prisma.policy.findMany({
      where: {
        paymentStatus: 'paid',
        brokerageAmount: { not: null }
      },
      select: {
        id: true,
        policyNumber: true,
        premium: true,
        brokerageRate: true,
        brokerageAmount: true,
        brokerageStatus: true,
        brokeragePaidAt: true,
        insurer: { select: { name: true } },
        user: { select: { name: true, phone: true } }
      }
    });

    const totalEarned = policies.reduce((sum, p) => sum + (p.brokerageAmount ?? 0), 0);
    const totalPending = policies.filter(p => p.brokerageStatus === 'pending').reduce((sum, p) => sum + (p.brokerageAmount ?? 0), 0);
    const totalReleased = policies.filter(p => p.brokerageStatus === 'paid').reduce((sum, p) => sum + (p.brokerageAmount ?? 0), 0);

    res.json({
      policies,
      stats: { totalEarned, totalPending, totalReleased }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/brokerage/release/:policyId', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { policyId } = z.object({ policyId: z.string().cuid() }).parse(req.params);
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        brokerageStatus: 'paid',
        brokeragePaidAt: new Date()
      }
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'RELEASE_BROKERAGE', { policyId, amount: policy.brokerageAmount });

    res.json({ policy });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Quote lead stage tracking ────────────────────────────────────────────────
router.patch('/quotes/:id/stage', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { stage } = z.object({
      stage: z.enum(['new', 'quotation_sent', 'in_discussion', 'closed', 'lost'])
    }).parse(req.body);

    const quote = await prisma.quote.update({
      where: { id },
      data: { stage }
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'UPDATE_QUOTE_STAGE', { quoteId: id, stage });

    res.json({ quote });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Agent KYC management ─────────────────────────────────────────────────────
router.post('/agents/kyc/upload', adminAuthenticate, upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).adminId;
    const file = (req as any).file;
    if (!file) { res.status(400).json({ error: 'No document file uploaded.' }); return; }

    const { docType } = z.object({
      docType: z.enum(['aadhaar', 'driving_license', 'passport'])
    }).parse(req.body);

    const ext = file.mimetype === 'application/pdf' ? 'pdf' : 'jpg';
    const key = `agent-kyc/${adminId}/${Date.now()}.${ext}`;
    const url = await uploadToR2(key, file.buffer, file.mimetype);

    const agent = await prisma.admin.update({
      where: { id: adminId },
      data: {
        kycStatus: 'submitted',
        kycDocType: docType,
        kycDocUrl: url,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
        kycVerifiedAt: null
      }
    });

    await logActivity(adminId, 'SUBMIT_AGENT_KYC', { docType, url });

    res.json({ success: true, kycStatus: 'submitted', docUrl: url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/agents/:id/kyc/verify', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string().cuid() }).parse(req.params);
    const { action, reason } = z.object({
      action: z.enum(['approve', 'reject']),
      reason: z.string().optional()
    }).parse(req.body);

    const data = action === 'approve' ? {
      kycStatus: 'verified',
      kycVerifiedAt: new Date(),
      kycRejectionReason: null
    } : {
      kycStatus: 'rejected',
      kycRejectionReason: reason ?? 'Verification failed',
      kycVerifiedAt: null
    };

    const agent = await prisma.admin.update({
      where: { id },
      data
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'VERIFY_AGENT_KYC', { agentId: id, action, reason });

    res.json({ success: true, agent });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Agent Customers ──────────────────────────────────────────────────────────
router.get('/customers', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).adminId;
    const adminRole = (req as any).adminRole;

    // Superadmins can see all customers, agents only see their own customers
    const where = adminRole === 'superadmin' ? {} : { agentId: adminId };

    const customers = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        kycStatus: true,
        createdAt: true
      }
    });

    res.json({ customers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/customers', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).adminId;
    const { name, phone, email } = z.object({
      name: z.string().min(2),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
      email: z.string().email().optional().nullable()
    }).parse(req.body);

    // Check if phone or email already registered
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existing) {
      res.status(409).json({ error: 'Customer with this phone or email already exists' });
      return;
    }

    const customer = await prisma.user.create({
      data: {
        name,
        phone,
        email: email ?? null,
        agentId: adminId,
        kycStatus: 'pending' // default
      }
    });

    await logActivity(adminId, 'ADD_CUSTOMER', { id: customer.id, name, phone });

    res.status(201).json({ customer });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Database Backup ──────────────────────────────────────────────────────────
router.post('/backup', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).adminId;
    const { runDatabaseBackup } = await import('../lib/backup');
    const backupUrl = await runDatabaseBackup();

    await logActivity(adminId, 'RUN_DATABASE_BACKUP', { backupUrl });

    res.json({ success: true, backupUrl });
  } catch (e: any) {
    console.error('[admin/backup]', e);
    res.status(500).json({ error: e?.message ?? 'Backup failed' });
  }
});

// ── Quotation Templates ──────────────────────────────────────────────────────
router.get('/templates', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.quotationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ templates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/templates', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      type: z.string().min(2),
      subject: z.string().optional().nullable(),
      headerText: z.string().optional().nullable(),
      footerText: z.string().optional().nullable(),
      termsAndConditions: z.string().optional().nullable(),
      isDefault: z.boolean().optional()
    }).parse(req.body);

    const data = {
      name: body.name,
      type: body.type,
      subject: body.subject ?? null,
      headerText: body.headerText ?? null,
      footerText: body.footerText ?? null,
      termsAndConditions: body.termsAndConditions ?? null,
      isDefault: body.isDefault ?? false
    };

    if (data.isDefault) {
      await prisma.quotationTemplate.updateMany({
        where: { type: body.type, isDefault: true },
        data: { isDefault: false }
      });
    }

    let template;
    const adminId = (req as any).adminId;

    if (body.id) {
      template = await prisma.quotationTemplate.update({
        where: { id: body.id },
        data
      });
      await logActivity(adminId, 'UPDATE_QUOTATION_TEMPLATE', { id: template.id, name: template.name });
    } else {
      template = await prisma.quotationTemplate.create({
        data
      });
      await logActivity(adminId, 'CREATE_QUOTATION_TEMPLATE', { id: template.id, name: template.name });
    }

    res.json({ success: true, template });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/templates/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;
    await prisma.quotationTemplate.delete({ where: { id: id as string } });
    await logActivity(adminId, 'DELETE_QUOTATION_TEMPLATE', { id });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Premium Rate Charts ──────────────────────────────────────────────────────
router.get('/rate-charts', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const charts = await prisma.premiumRateChart.findMany({
      include: { insurer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ charts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/rate-charts', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = z.object({
      id: z.string().optional(),
      insurerId: z.string(),
      insuranceType: z.string(),
      minAge: z.number().int().optional().nullable(),
      maxAge: z.number().int().optional().nullable(),
      baseRate: z.number().positive(),
      rateType: z.enum(['flat', 'percentage_of_sum_insured']).optional(),
      gstPercentage: z.number().nonnegative().optional()
    }).parse(req.body);

    const data = {
      insurerId: body.insurerId,
      insuranceType: body.insuranceType,
      minAge: body.minAge ?? null,
      maxAge: body.maxAge ?? null,
      baseRate: body.baseRate,
      rateType: body.rateType ?? 'flat',
      gstPercentage: body.gstPercentage ?? 18.0
    };

    let chart;
    const adminId = (req as any).adminId;

    if (body.id) {
      chart = await prisma.premiumRateChart.update({
        where: { id: body.id },
        data
      });
      await logActivity(adminId, 'UPDATE_PREMIUM_RATE_CHART', { id: chart.id, insurerId: chart.insurerId });
    } else {
      chart = await prisma.premiumRateChart.create({
        data
      });
      await logActivity(adminId, 'CREATE_PREMIUM_RATE_CHART', { id: chart.id, insurerId: chart.insurerId });
    }

    res.json({ success: true, chart });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/rate-charts/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = (req as any).adminId;
    await prisma.premiumRateChart.delete({ where: { id: id as string } });
    await logActivity(adminId, 'DELETE_PREMIUM_RATE_CHART', { id });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Brokerage CSV Export ─────────────────────────────────────────────────────
router.get('/brokerage/export', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const policies = await prisma.policy.findMany({
      where: {
        brokerageAmount: { not: null }
      },
      include: {
        user: { select: { name: true, phone: true } },
        insurer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let csv = 'Policy Number,Insurer,Customer,Phone,Premium,Brokerage Rate (%),Brokerage Amount (₹),Status,Paid At\n';
    for (const p of policies) {
      const rate = p.brokerageRate ? `${p.brokerageRate}%` : '—';
      const amount = p.brokerageAmount ? `${p.brokerageAmount}` : '0';
      const paidAt = p.brokeragePaidAt ? new Date(p.brokeragePaidAt).toLocaleDateString('en-IN') : '—';
      csv += `"${p.policyNumber}","${p.insurer?.name || p.provider}","${p.user?.name || '—'}","${p.user?.phone}","${p.premium}","${rate}","${amount}","${p.brokerageStatus}","${paidAt}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=brokerage-payouts.csv');
    res.status(200).send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Renewals Pipeline ────────────────────────────────────────────────────────
router.get('/renewals', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const renewals = await prisma.renewal.findMany({
      include: {
        policy: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            insurer: { select: { name: true } }
          }
        },
        agent: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ renewals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/renewals/auto-detect', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const now = new Date();

    const expiringPolicies = await prisma.policy.findMany({
      where: {
        status: 'active',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        renewal: true,
        user: { select: { name: true, phone: true } }
      }
    });

    let createdCount = 0;
    for (const p of expiringPolicies) {
      if (!p.renewal) {
        const user = await prisma.user.findUnique({
          where: { id: p.userId },
          select: { agentId: true }
        });

        await prisma.renewal.create({
          data: {
            policyId: p.id,
            agentId: user?.agentId ?? null,
            status: 'pending'
          }
        });
        createdCount++;

        await prisma.notification.create({
          data: {
            userId: p.userId,
            type: 'policy_expiry',
            title: 'Policy Nearing Expiry',
            body: `Your ${p.type} policy ${p.policyNumber} is expiring on ${p.endDate.toLocaleDateString('en-IN')}. Renew today to ensure continuous coverage!`
          }
        });
      }
    }

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'AUTO_DETECT_RENEWALS', { detectedCount: expiringPolicies.length, createdCount });

    res.json({ success: true, detectedCount: expiringPolicies.length, createdCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/renewals/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = z.object({
      agentId: z.string().optional().nullable(),
      status: z.enum(['pending', 'contacted', 'closed', 'lost']).optional(),
      notes: z.string().optional().nullable()
    }).parse(req.body);

    const data: Record<string, any> = {};
    if (body.agentId !== undefined) {
      data.agentId = body.agentId;
      data.assignedAt = body.agentId ? new Date() : null;
    }
    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    const renewal = await prisma.renewal.update({
      where: { id: id as string },
      data,
      include: {
        policy: { select: { policyNumber: true } }
      }
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'UPDATE_RENEWAL', { id: renewal.id, policyNumber: (renewal as any).policy?.policyNumber || '', status: renewal.status });

    res.json({ success: true, renewal });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ── Claims Status Management ──────────────────────────────────────────────────
router.patch('/claims/:id', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = z.object({
      status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'paid', 'settled']),
      notes: z.string().optional()
    }).parse(req.body);

    const claim = await prisma.claim.findUnique({ where: { id: id as string } });
    if (!claim) { res.status(404).json({ error: 'Claim not found' }); return; }

    const updatedClaim = await prisma.claim.update({
      where: { id: id as string },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {}),
        ...(status === 'approved' ? { approvedDate: new Date() } : {}),
        ...(status === 'paid' || status === 'settled' ? { paidDate: new Date() } : {}),
      }
    });

    // When claim is approved/paid/settled, update policy status to 'claimed' so it moves out of active policies
    if (['approved', 'paid', 'settled'].includes(status) && claim.policyId) {
      await prisma.policy.update({
        where: { id: claim.policyId },
        data: { status: 'claimed' }
      }).catch(() => {});
    }

    await prisma.notification.create({
      data: {
        userId: claim.userId,
        type:   'info',
        title:  `Claim ${status.replace('_', ' ').toUpperCase()}! 🎉`,
        body:   `Your claim #${claim.claimNumber} status has been updated to ${status}.`,
      }
    }).catch(() => {});

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'UPDATE_CLAIM', { id: claim.id, claimNumber: claim.claimNumber, status });

    res.json({ success: true, claim: updatedClaim });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ── Communication Templates ──────────────────────────────────────────────────
router.get('/communication-templates', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await prisma.communicationTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ templates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/communication-templates', adminAuthenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = z.object({
      id: z.string().optional(),
      name: z.string().min(2),
      channel: z.enum(['sms', 'email', 'push']),
      trigger: z.string().min(2),
      content: z.string().min(2)
    }).parse(req.body);

    const data = {
      name: body.name,
      channel: body.channel,
      trigger: body.trigger,
      content: body.content
    };

    let template;
    const adminId = (req as any).adminId;

    if (body.id) {
      template = await prisma.communicationTemplate.update({
        where: { id: body.id },
        data
      });
      await logActivity(adminId, 'UPDATE_COMM_TEMPLATE', { id: template.id, name: template.name });
    } else {
      template = await prisma.communicationTemplate.create({
        data
      });
      await logActivity(adminId, 'CREATE_COMM_TEMPLATE', { id: template.id, name: template.name });
    }

    res.json({ success: true, template });
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: (e.issues || (e as any).errors)?.[0]?.message ?? 'Invalid request' }); return; }
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── CSV Bulk Import Agents ───────────────────────────────────────────────────
router.post('/agents/bulk-import', adminAuthenticate, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    let csvText = '';
    if (req.file) {
      csvText = req.file.buffer.toString('utf-8');
    } else if (req.body?.csv) {
      csvText = String(req.body.csv);
    } else {
      res.status(400).json({ error: 'No CSV file or data provided' });
      return;
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      res.status(400).json({ error: 'CSV file is empty or has no data rows' });
      return;
    }

    const headerLine = lines[0] ?? '';
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
    const nameIdx     = headers.findIndex(h => h.includes('name'));
    const emailIdx    = headers.findIndex(h => h.includes('email'));
    const phoneIdx    = headers.findIndex(h => h.includes('phone'));
    const passIdx     = headers.findIndex(h => h.includes('password') || h.includes('pass'));
    const insurersIdx = headers.findIndex(h => h.includes('insurer'));
    const typesIdx    = headers.findIndex(h => h.includes('type'));

    if (nameIdx === -1 || emailIdx === -1) {
      res.status(400).json({ error: 'CSV must contain at least "name" and "email" headers' });
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const lineStr = lines[i] ?? '';
      const row = lineStr.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.length === 0 || !row[emailIdx]) continue;

      const name = row[nameIdx] || 'Agent';
      const email = row[emailIdx].toLowerCase();
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '';
      const rawPassword = passIdx !== -1 && row[passIdx] ? row[passIdx] : 'Agent@12345';
      const rawInsurers = insurersIdx !== -1 && row[insurersIdx] ? row[insurersIdx].split(';').map(s => s.trim()) : [];
      const rawTypes = typesIdx !== -1 && row[typesIdx] ? row[typesIdx].split(';').map(s => s.trim()) : [];

      try {
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
          skippedCount++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const agentCode = await generateAgentId();

        await prisma.admin.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: 'agent',
            agentCode,
            assignedInsurers: JSON.stringify(rawInsurers),
            assignedInsuranceTypes: JSON.stringify(rawTypes),
            isActive: true,
          }
        });
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${email}): ${err.message || 'Error'}`);
      }
    }

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'BULK_IMPORT_AGENTS', { importedCount, skippedCount });

    res.json({ success: true, importedCount, skippedCount, errors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /admin/posp-applications ──────────────────────────────────────────────
router.get('/posp-applications', adminAuthenticate, superadminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const applications = await prisma.pospApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ applications });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /admin/posp-applications/:id/approve ────────────────────────────────
router.post('/posp-applications/:id/approve', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const appId = String(req.params.id);
    const application = await prisma.pospApplication.findUnique({ where: { id: appId } });

    if (!application) {
      res.status(404).json({ error: 'POSP application not found' });
      return;
    }

    if (application.status === 'approved') {
      res.status(400).json({ error: 'POSP application is already approved' });
      return;
    }

    // Generate unique POSP Agent Code (ASxxxxxx)
    const agentCode = await generateAgentId();
    const defaultPassword = await bcrypt.hash('POSP@12345', 12);

    // Create or update Admin record with role: 'agent'
    let adminRecord = await prisma.admin.findUnique({ where: { email: application.email } });

    if (!adminRecord) {
      adminRecord = await prisma.admin.create({
        data: {
          email: application.email,
          name: application.name,
          password: defaultPassword,
          role: 'agent',
          agentCode,
          isActive: true,
          kycStatus: 'verified',
          kycDocType: 'aadhaar_pan',
          kycDocUrl: application.aadhaarDocUrl,
          kycVerifiedAt: new Date(),
        },
      });
    } else {
      adminRecord = await prisma.admin.update({
        where: { id: adminRecord.id },
        data: {
          role: 'agent',
          agentCode: adminRecord.agentCode || agentCode,
          isActive: true,
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
        },
      });
    }

    const updatedApp = await prisma.pospApplication.update({
      where: { id: appId },
      data: {
        status: 'approved',
        assignedAgentCode: adminRecord.agentCode || agentCode,
        createdAdminId: adminRecord.id,
      },
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'APPROVE_POSP_APPLICATION', {
      applicationId: appId,
      candidateEmail: application.email,
      assignedCode: adminRecord.agentCode || agentCode,
    });

    res.json({
      success: true,
      application: updatedApp,
      agentCode: adminRecord.agentCode || agentCode,
      message: `POSP Candidate approved! Advisor account created with code ${adminRecord.agentCode || agentCode}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve POSP application' });
  }
});

// ── POST /admin/posp-applications/:id/reject ─────────────────────────────────
router.post('/posp-applications/:id/reject', adminAuthenticate, superadminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const appId = String(req.params.id);
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

    const application = await prisma.pospApplication.findUnique({ where: { id: appId } });
    if (!application) {
      res.status(404).json({ error: 'POSP application not found' });
      return;
    }

    const updatedApp = await prisma.pospApplication.update({
      where: { id: appId },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'Documentation verification failed or unverified details.',
      },
    });

    const adminId = (req as any).adminId;
    await logActivity(adminId, 'REJECT_POSP_APPLICATION', {
      applicationId: appId,
      candidateEmail: application.email,
      reason,
    });

    res.json({
      success: true,
      application: updatedApp,
      message: 'POSP candidate application rejected.',
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject POSP application' });
  }
});

export { router as adminRouter };
