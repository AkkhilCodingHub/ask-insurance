import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const OTP_LENGTH = Number(process.env.OTP_LENGTH ?? 6);
const OTP_EXPIRATION_MS = Number(process.env.OTP_EXPIRATION_MS ?? 5 * 60 * 1000);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
const OTP_SALT_ROUNDS = Number(process.env.OTP_SALT_ROUNDS ?? 10);

const generateOtp = (): string => {
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

const hashOtp = async (otp: string): Promise<string> => bcrypt.hash(otp, OTP_SALT_ROUNDS);
const compareOtp = async (otp: string, hash: string): Promise<boolean> => bcrypt.compare(otp, hash);

export const createOtpChallenge = async (phone: string, userId?: string): Promise<string> => {
  await prisma.otpChallenge.deleteMany({ where: { phone } });

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

  const data: { phone: string; otpHash: string; expiresAt: Date; userId?: string } = {
    phone,
    otpHash,
    expiresAt
  };

  if (userId) {
    data.userId = userId;
  }

  await prisma.otpChallenge.create({
    data
  });

  return otp;
};

export const verifyOtpChallenge = async (phone: string, otp: string): Promise<{ success: boolean; error?: string; userId?: string }> => {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone,
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!challenge) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, error: 'Too many invalid OTP retries. Please request a new OTP later.' };
  }

  const isValid = await compareOtp(otp, challenge.otpHash);
  if (!isValid) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: challenge.attempts + 1 }
    });

    if (challenge.attempts + 1 >= OTP_MAX_ATTEMPTS) {
      return { success: false, error: 'Too many invalid OTP retries. Please request a new OTP later.' };
    }

    return { success: false, error: 'Invalid OTP' };
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() }
  });

  if (challenge.userId) {
    return { success: true, userId: challenge.userId };
  }

  return { success: true };
};
