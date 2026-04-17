import jwt, { type Algorithm, type JwtPayload, type SignOptions, type VerifyOptions } from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  phone: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be set in environment variables');
  return secret;
}

function getRefreshSecret(): string {
  // Falls back to JWT_SECRET + suffix so no new env var is required
  return process.env.JWT_REFRESH_SECRET ?? (getSecret() + '_refresh');
}

const JWT_ISSUER            = process.env.JWT_ISSUER ?? 'ask-api';
const JWT_AUDIENCE          = process.env.JWT_AUDIENCE ?? 'insurance-app';
const JWT_REFRESH_AUDIENCE  = JWT_AUDIENCE + '-refresh';

// Access token: 7 days (was 1d — short enough to rotate, long enough for normal mobile use)
const JWT_EXPIRES_IN         = (process.env.JWT_EXPIRES_IN         ?? '7d')  as string & jwt.SignOptions['expiresIn'];
// Refresh token: 30 days — silently re-issues access tokens so users are never logged out unexpectedly
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? '30d') as string & jwt.SignOptions['expiresIn'];

const signOptions: SignOptions = {
  algorithm: 'HS256' as Algorithm,
  issuer:    JWT_ISSUER,
  audience:  JWT_AUDIENCE,
  expiresIn: JWT_EXPIRES_IN,
};

const refreshSignOptions: SignOptions = {
  algorithm: 'HS256' as Algorithm,
  issuer:    JWT_ISSUER,
  audience:  JWT_REFRESH_AUDIENCE,
  expiresIn: JWT_REFRESH_EXPIRES_IN,
};

const verifyOptions: VerifyOptions = {
  algorithms: ['HS256'],
  issuer:     JWT_ISSUER,
  audience:   JWT_AUDIENCE,
};

const refreshVerifyOptions: VerifyOptions = {
  algorithms: ['HS256'],
  issuer:     JWT_ISSUER,
  audience:   JWT_REFRESH_AUDIENCE,
};

// ── Access token ───────────────────────────────────────────────────────────────

export const createAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, getSecret(), signOptions);

function isAuthTokenPayload(decoded: string | JwtPayload): decoded is JwtPayload & AuthTokenPayload {
  return (
    typeof decoded !== 'string' &&
    typeof decoded.userId === 'string' &&
    typeof decoded.phone  === 'string'
  );
}

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, getSecret(), verifyOptions);
  if (!isAuthTokenPayload(decoded)) throw new Error('Invalid token payload');
  return { userId: decoded.userId, phone: decoded.phone };
};

// ── Refresh token ──────────────────────────────────────────────────────────────

export const createRefreshToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, getRefreshSecret(), refreshSignOptions);

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, getRefreshSecret(), refreshVerifyOptions);
  if (!isAuthTokenPayload(decoded)) throw new Error('Invalid refresh token payload');
  return { userId: decoded.userId, phone: decoded.phone };
};
