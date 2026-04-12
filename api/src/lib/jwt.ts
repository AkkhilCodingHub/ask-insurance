import jwt, { Algorithm, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export interface AuthTokenPayload {
  userId: string;
  phone: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'ask-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'insurance-app';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1d') as StringValue;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

const signOptions: SignOptions = {
  algorithm: 'HS256' as Algorithm,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
  expiresIn: JWT_EXPIRES_IN
};

const verifyOptions: VerifyOptions = {
  algorithms: ['HS256'],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};

export const createAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, JWT_SECRET as Secret, signOptions);

export const verifyAuthToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, JWT_SECRET as Secret, verifyOptions) as AuthTokenPayload;
