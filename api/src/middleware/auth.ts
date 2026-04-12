import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../lib/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')?.trim();
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
