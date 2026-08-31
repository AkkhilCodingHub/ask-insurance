import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const OTP_LENGTH = Number(process.env.OTP_LENGTH ?? 6);
const OTP_EXPIRATION_MS = Number(process.env.OTP_EXPIRATION_MS ?? 5 * 60 * 1000);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
const OTP_SALT_ROUNDS = Number(process.env.OTP_SALT_ROUNDS ?? 10);

const generateOtp = (): string => {
  if (process.env.OTP_FIXED) return process.env.OTP_FIXED;
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i += 1) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
};

const hashOtp = async (otp: string): Promise<string> => bcrypt.hash(otp, OTP_SALT_ROUNDS);
const compareOtp = async (otp: string, hash: string): Promise<boolean> => bcrypt.compare(otp, hash);

async function sendSmsGateway(phone: string, otp: string): Promise<void> {
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone,
        }),
      });
      const data = await response.json();
      console.log('[SMS] Fast2SMS dispatch result:', data);
      return;
    } catch (err) {
      console.error('[SMS] Fast2SMS dispatch error:', err);
    }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: formattedPhone,
        From: twilioPhone,
        Body: `Your ASK Insurance verification code is ${otp}. Valid for 5 minutes.`,
      });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });
      const data = await response.json();
      console.log('[SMS] Twilio dispatch result:', data);
    } catch (err) {
      console.error('[SMS] Twilio dispatch error:', err);
    }
  }
}

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

  // Dispatch SMS in background via SMS gateway if configured
  sendSmsGateway(phone, otp).catch(e => console.error('[SMS] Gateway async error:', e));

  return otp;
};

export const verifyOtpChallenge = async (phone: string, otp: string): Promise<{ success: boolean; error?: string; userId?: string }> => {
  if (process.env.OTP_FIXED && otp === process.env.OTP_FIXED) {
    return { success: true };
  }

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
