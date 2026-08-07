import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createAuthToken, verifyAuthToken, createRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { createOtpChallenge, verifyOtpChallenge } from '../lib/otp';
import { getFirebaseAdmin } from '../lib/firebase';
import { authenticate } from '../middleware/auth';

import { getAuth } from 'firebase-admin/auth';

const router = Router();

const cleanPhone = (val: string) => val.replace(/\D/g, '').slice(-10);

const sendOtpSchema = z.object({
  phone: z.string().transform(cleanPhone).pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'))
});

const verifyOtpSchema = z.object({
  phone: z.string().transform(cleanPhone).pipe(z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number')),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

export const autoAssignAgentToUser = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { agentId: true } });
    if (!user || user.agentId) return;

    const agent = await prisma.admin.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' }
    });

    if (agent) {
      await prisma.user.update({
        where: { id: userId },
        data: { agentId: agent.id }
      });
      console.log(`[AutoAssign] Assigned agent ${agent.name} (${agent.id}) to user ${userId}`);
    }
  } catch (err) {
    console.error('[AutoAssign] Error:', err);
  }
};

router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.create({ data: { phone, customerCode } });
    } else if (!user.customerCode) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.update({ where: { id: user.id }, data: { customerCode } });
    }

    if (user.id) {
      await autoAssignAgentToUser(user.id);
    }

    const otp = await createOtpChallenge(phone, user.id);
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully', isNewUser });
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

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    const verifyResult = await verifyOtpChallenge(phone, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.create({
        data: {
          phone,
          customerCode
        }
      });
      await autoAssignAgentToUser(user.id);
    }

    if (!user.customerCode) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.update({ where: { id: user.id }, data: { customerCode } });
    }

    if (!user.agentId) {
      await autoAssignAgentToUser(user.id);
    }

    const token        = createAuthToken({ userId: user.id, phone: user.phone });
    const refreshToken = createRefreshToken({ userId: user.id, phone: user.phone });

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        customerCode: user.customerCode,
        phone: user.phone,
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        kycStatus: user.kycStatus,
        aadhaarVerified: user.aadhaarVerified
      },
      isNewUser: !Boolean(user.name)
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

router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        pincode: true,
        kycStatus: true,
        aadhaarVerified: true,
        kycVerifiedAt: true,
        kycDocType: true,
        kycRejectionReason: true,
        kycSubmittedAt: true,
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User session expired or user not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('[auth/me]', error);
    res.status(401).json({ error: 'Session invalid' });
  }
});

// ── POST /refresh ─────────────────────────────────────────────────────────────
const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);

    // Ensure user still exists (handles deleted accounts)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Issue a fresh pair (rotation — old refresh token is implicitly invalidated by expiry)
    const newAccessToken  = createAuthToken({ userId: user.id, phone: user.phone });
    const newRefreshToken = createRefreshToken({ userId: user.id, phone: user.phone });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }
});

// ── POST /verify-firebase ─────────────────────────────────────────────────────
// Exchanges a Firebase Phone Auth ID token for an ASK JWT.
// Called by the mobile app after Firebase verifies the user's phone number.

router.post('/verify-firebase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    const decoded = await getAuth(getFirebaseAdmin()).verifyIdToken(idToken);
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      res.status(400).json({ error: 'Firebase token does not contain a phone number' });
      return;
    }

    // Normalise to 10-digit format (strip +91 country code)
    const phone = rawPhone.replace(/^\+91/, '');

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.create({ data: { phone, customerCode } });
    } else if (!user.customerCode) {
      const customerCode = `ASK-CUST-${Math.floor(100000 + Math.random() * 900000)}`;
      user = await prisma.user.update({ where: { id: user.id }, data: { customerCode } });
    }

    if (user.id) {
      await autoAssignAgentToUser(user.id);
    }

    const token        = createAuthToken({ userId: user.id, phone: user.phone });
    const refreshToken = createRefreshToken({ userId: user.id, phone: user.phone });

    res.json({
      success: true,
      token,
      refreshToken,
      user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
      isNewUser: isNewUser || !Boolean(user.name),
    });
  } catch (error) {
    console.error('[verify-firebase]', error);
    res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
});

export { router as authRouter };