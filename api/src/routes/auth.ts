import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createAuthToken, createRefreshToken, verifyRefreshToken } from '../lib/jwt';
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
      console.log('[AutoAssign] Assigned agent to user');
    }
  } catch {
    console.error('[AutoAssign] Failed to auto-assign agent');
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
    console.log('[send-otp] OTP generated successfully');

    const responsePayload: Record<string, any> = {
      success: true,
      message: 'OTP sent successfully',
      isNewUser,
      customerCode: user.customerCode
    };

    if (process.env.NODE_ENV === 'test') {
      responsePayload.otp = otp;
    }

    res.json(responsePayload);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }
    console.error('[send-otp] Error sending OTP challenge');
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const verifySchema = z.object({
      phone: z.string().optional(),
      identifier: z.string().optional(),
      customerCode: z.string().optional(),
      otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
    });

    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: (parsed.error.issues || (parsed.error as any).errors)?.[0]?.message ?? 'Invalid request' });
      return;
    }

    const rawInput = String(parsed.data.phone || parsed.data.identifier || parsed.data.customerCode || '').trim();
    const otp = parsed.data.otp;

    if (!rawInput) {
      res.status(400).json({ error: 'Phone number or Customer ID is required' });
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

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      const customerCode = await generateCustomerId();
      user = await prisma.user.create({
        data: {
          phone,
          customerCode,
        }
      });
    }

    if (!user) {
      res.status(500).json({ error: 'Failed to initialize user profile' });
      return;
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
        aadhaarVerified: user.aadhaarVerified,
        panNumber: user.panNumber,
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
        panNumber: true,
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
    const { idToken } = z.object({ idToken: z.string().min(10, 'Firebase ID token is required') }).parse(req.body);
    const decoded = await getAuth(getFirebaseAdmin()).verifyIdToken(idToken);
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      res.status(401).json({ error: 'Token does not contain a verified phone number' });
      return;
    }

    const phone = rawPhone.replace(/^\+91/, '');
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400).json({ error: 'Invalid phone number from token' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;
    if (!user) {
      const customerCode = await generateCustomerId();
      user = await prisma.user.create({ data: { phone, customerCode } });
    }

    if (!user) {
      res.status(500).json({ error: 'Failed to initialize user profile' });
      return;
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
  } catch {
    console.error('[verify-firebase] Verification failed');
    res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
});

// ── POST /web-login ────────────────────────────────────────────────────────
// Web / Support chat authentication requiring Email and Mandatory 10-digit Phone Number.
// Registers or fetches user, links them to an agent, and issues auth tokens.

const webLoginSchema = z.object({
  email: z.string().email('A valid email address is required'),
  phone: z.string().min(10, 'A valid 10-digit phone number is mandatory'),
  name:  z.string().min(2).max(100).optional(),
});

router.post('/web-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone: rawPhone, name } = webLoginSchema.parse(req.body);
    const phone = cleanPhone(rawPhone);

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check by phone first or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email: normalizedEmail }
        ]
      }
    });

    const isNewUser = !user;

    if (!user) {
      const customerCode = await generateCustomerId();
      user = await prisma.user.create({
        data: {
          phone,
          email: normalizedEmail,
          name: name ? name.trim() : null,
          customerCode,
        }
      });
    } else {
      // Update missing fields
      const updateData: Record<string, any> = {};
      if (!user.email && normalizedEmail) updateData.email = normalizedEmail;
      if (!user.name && name) updateData.name = name.trim();
      if (!user.phone && phone) updateData.phone = phone;
      if (!user.customerCode || user.customerCode.startsWith('ASK-CUST-')) {
        updateData.customerCode = await generateCustomerId();
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
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
      user: {
        id: user.id,
        customerCode: user.customerCode,
        phone: user.phone,
        name: user.name,
        email: user.email,
        kycStatus: user.kycStatus,
      },
      isNewUser: isNewUser || !Boolean(user.name),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error.issues || (error as any).errors)?.[0]?.message ?? 'Invalid request parameters' });
      return;
    }
    console.error('[web-login] Error during web support login:', error);
    res.status(500).json({ error: 'Failed to authenticate user. Please try again.' });
  }
});

export { router as authRouter };