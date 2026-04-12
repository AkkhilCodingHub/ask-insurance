import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createAuthToken, verifyAuthToken } from '../lib/jwt';
import { createOtpChallenge, verifyOtpChallenge } from '../lib/otp';

const router = Router();

const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number')
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

router.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = sendOtpSchema.parse(req.body);

    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    const otp = await createOtpChallenge(phone, user.id);
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({ success: true, message: 'OTP sent successfully', isNewUser });
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

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    const verifyResult = await verifyOtpChallenge(phone, otp);
    if (!verifyResult.success) {
      res.status(400).json({ error: verifyResult.error });
      return;
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const token = createAuthToken({ userId: user.id, phone: user.phone });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email
      },
      isNewUser: !Boolean(user.name)
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

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '').trim();
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
    return;
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
});

export { router as authRouter };