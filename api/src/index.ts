import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
  'http://localhost:3000',
  'http://localhost:3001'
];

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const authRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Too many authentication requests. Please wait 15 minutes.' }
});

app.use('/api/auth', authRouteLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/plans', plansRouter);
app.use('/api/payments', paymentsRouter);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});