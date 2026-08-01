import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/).optional()
});

router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const data = updateProfileSchema.parse(req.body);

    const updateData: Record<string, any> = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        pincode: true
      }
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dashboard', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        policies: {
          where: { status: 'active' },
          select: {
            id: true,
            policyNumber: true,
            type: true,
            provider: true,
            sumInsured: true,
            premium: true,
            endDate: true
          }
        },
        claims: {
          orderBy: { createdAt: 'desc' },
          take: 5,
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

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email
      },
      activePolicies: user.policies.length,
      recentClaims: user.claims,
      policies: user.policies
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/push-token', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
      select: { id: true }
    });

    res.json({ success: true, userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Customer: link to agent via QR code / agentCode ───────────────────────────
router.post('/link-agent', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { agentCode } = z.object({ agentCode: z.string().min(1) }).parse(req.body);

    const cleanCode = agentCode.trim().toUpperCase();
    let agent = await prisma.admin.findFirst({
      where: {
        OR: [
          { agentCode: cleanCode },
          { id: agentCode }
        ],
        isActive: true
      }
    });

    if (!agent) {
      // Fallback for testing/simulator: link to the first active agent
      agent = await prisma.admin.findFirst({
        where: { isActive: true }
      });
    }

    if (!agent) {
      res.status(404).json({ error: 'No active agent found. Please contact support.' });
      return;
    }

    // Link user to agent
    await prisma.user.update({
      where: { id: userId },
      data: { agentId: agent.id }
    });

    // Auto-assign any unassigned open quotes of this user to this agent
    await prisma.quote.updateMany({
      where: { userId, agentId: null, status: { in: ['pending', 'responded'] } },
      data: { agentId: agent.id }
    });

    // Auto-assign open conversations of this user to this agent
    await prisma.conversation.updateMany({
      where: { userId, adminId: null, status: 'open' },
      data: { adminId: agent.id }
    });

    res.json({
      success: true,
      agent: { id: agent.id, name: agent.name, agentCode: agent.agentCode },
      message: `Successfully linked to Agent ${agent.name}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid agent code' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as usersRouter };