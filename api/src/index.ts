import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { policiesRouter } from './routes/policies';
import { claimsRouter } from './routes/claims';
import { quotesRouter } from './routes/quotes';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { chatRouter } from './routes/chat';
import { plansRouter } from './routes/plans';
import { paymentsRouter } from './routes/payments';
import { kycRouter } from './routes/kyc';
import { documentsRouter } from './routes/documents';
import vehiclesRouter from './routes/vehicles';
import endorsementsRouter from './routes/endorsements';
import pospRouter from './routes/posp';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://ask-api.bitopayments.com'
];

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Non-browser or same-origin clients (mobile app, server-to-server)
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Rate Limiter for API Protection on Render
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// Webhook needs the raw body for HMAC verification — must be registered BEFORE
// the global json() middleware consumes the stream.
app.use('/api/payments/razorpay/webhook', express.raw({ type: '*/*' }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Fast Health Check — lightweight, no DB
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'ASK Insurance API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    keepAlive: true
  });
});

// Unified Keep-Alive: pings both the Render container AND the Aiven MySQL database.
// Point a single cron-job.org job at this endpoint every 5 minutes to keep both alive.
app.get('/api/cron/keep-alive', async (_req: Request, res: Response) => {
  let dbStatus = 'unknown';
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = 'ok';
  } catch (err: any) {
    dbStatus = `error: ${err?.message ?? 'unknown'}`;
    console.warn('[keep-alive] DB ping failed:', err?.message);
  }
  res.status(200).json({
    status: 'OK',
    service: 'ASK Insurance API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    keepAlive: true
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ name: 'ASK Insurance API', status: 'running', keepAlive: true });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/plans', plansRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/endorsements', endorsementsRouter);
app.use('/api/posp', pospRouter);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});

// Graceful Shutdown for Render Container Redeploys
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[HTTP] Closed all connections.');
    await prisma.$disconnect().catch(() => {});
    console.log('[Prisma] Disconnected from database.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));