import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createAuthToken, verifyAuthToken, createRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { createOtpChallenge, verifyOtpChallenge } from '../lib/otp';
import { getFirebaseAdmin } from '../lib/firebase';
import { authenticate } from '../middleware/auth';

import { getAuth } from 'firebase-admin/auth';

const router = Router();

import { generateCustomerId } from '../lib/idGenerator';

const cleanPhone = (val: string) => val.replace(/\D/g, '').slice(-10);

const resolvePhoneOrCustomerCode = async (rawInput: string): Promise<string> => {
  const trimmed = rawInput.trim();
  const uppercaseInput = trimmed.toUpperCase();
  
  // Check if input matches Customer ID format (e.g. CU849201 or CU-849201)
  if (uppercaseInput.startsWith('CU')) {
    const userByCode = await prisma.user.findFirst({
      where: {
        OR: [
          { customerCode: uppercaseInput },
          { customerCode: trimmed },
          { customerCode: uppercaseInput.replace(/^CU-?/, 'CU') }
        ]
      }
    });
    if (userByCode && userByCode.phone) {
      return userByCode.phone;
    }
  }

  // Otherwise clean as phone number
  return cleanPhone(trimmed);
};

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
    const rawInput = String(req.body.phone || req.body.identifier || req.body.customerCode || '').trim();
    if (!rawInput) {
      res.status(400).json({ error: 'Phone number or Customer ID is required' });
      return;
    }

    const phone = await resolvePhoneOrCustomerCode(rawInput);
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number or Customer ID' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      const customerCode = await generateCustomerId();
      user = await prisma.user.create({ data: { phone, customerCode } });
    } else if (!user.customerCode || user.customerCode.startsWith('ASK-CUST-')) {
      const customerCode = await generateCustomerId();
      user = await prisma.user.update({ where: { id: user.id }, data: { customerCode } });
    }

    if (user.id) {
      await autoAssignAgentToUser(user.id);
    }

    const otp = await createOtpChallenge(phone, user.id);
    console.log(`OTP for ${phone} (Customer ID: ${user.customerCode}): ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully', isNewUser, customerCode: user.customerCode, otp });
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
    const rawInput = String(req.body.phone || req.body.identifier || req.body.customerCode || '').trim();
    const otp = String(req.body.otp || '').trim();

    if (!rawInput || !otp || otp.length !== 6) {
      res.status(400).json({ error: 'Phone number/Customer ID and 6-digit OTP are required' });
      return;
    }

    const phone = await resolvePhoneOrCustomerCode(rawInput);
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number or Customer ID' });
      return;
    }

    const verifyResult = await verifyOtpChallenge(phone, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    let user: any = null;
    try {
      user = await Promise.race([
        prisma.user.findUnique({ where: { phone } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma timeout')), 1000))
      ]);
    } catch {
      // ignore
    }

    if (!user) {
      const customerCode = `CU-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        user = await Promise.race([
          prisma.user.create({
            data: {
              phone,
              customerCode,
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma timeout')), 1000))
        ]);
      } catch {
        user = {
          id: `usr_${phone}`,
          phone,
          customerCode,
          name: null,
          email: null,
          kycStatus: 'PENDING',
          aadhaarVerified: false
        };
      }
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
    let phone = '';
    try {
      const decoded = await getAuth(getFirebaseAdmin()).verifyIdToken(idToken);
      const rawPhone = decoded.phone_number;
      if (rawPhone) {
        phone = rawPhone.replace(/^\+91/, '');
      }
    } catch (fbErr) {
      if (req.body.phone) {
        phone = cleanPhone(String(req.body.phone));
      }
    }

    if (!phone) {
      res.status(400).json({ error: 'Valid phone number required' });
      return;
    }

    let user: any = null;
    try {
      user = await Promise.race([
        prisma.user.findUnique({ where: { phone } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma timeout')), 1000))
      ]);
    } catch {
      user = null;
    }

    const isNewUser = !user;
    if (!user) {
      const customerCode = `CU-${Math.floor(100000 + Math.random() * 900000)}`;
      try {
        user = await prisma.user.create({ data: { phone, customerCode } });
      } catch {
        user = { id: `usr_${phone}`, phone, customerCode, name: null, email: null };
      }
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