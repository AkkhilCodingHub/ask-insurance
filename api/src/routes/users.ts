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
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = updateProfileSchema.parse(req.body);
    const updateData: {
      name?: string;
      email?: string;
      dateOfBirth?: Date | null;
      gender?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;

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

router.get('/dashboard', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

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
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.put('/push-token', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
      select: { id: true }
    });

    res.json({ success: true, userId: user.id });
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

export { router as usersRouter };