import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyAuthToken(token);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    console.error('Authentication failed', error);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const decoded = verifyAuthToken(token);
        req.userId = decoded.userId;
      }
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  return next();
};

// Must be used after authenticate (relies on req.userId being set).
export const requireKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { kycStatus: true, panNumber: true, aadhaarVerified: true },
    });

    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    // If user has verified KYC or has both PAN and Aadhaar verified, allow through
    if (user.kycStatus === 'verified' || (user.panNumber && user.aadhaarVerified)) {
      if (user.kycStatus !== 'verified') {
        await prisma.user.update({
          where: { id: userId },
          data: { kycStatus: 'verified', kycVerifiedAt: new Date() }
        }).catch(() => {});
      }
      return next();
    }

    if (user.kycStatus !== 'verified') {
      res.status(403).json({
        error:     'KYC verification required',
        kycStatus: user.kycStatus,
        message:   'Please complete KYC verification before proceeding.',
      });
      return;
    }

    return next();
  } catch (error) {
    console.error('[requireKyc]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
