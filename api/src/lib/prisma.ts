import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const url = new URL(process.env.DATABASE_URL ?? '');

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 4, // Keeps pool size small for Aiven free tier limits
  allowPublicKeyRetrieval: true,
  connectTimeout: 5000, // Timeout after 5 seconds instead of hanging
  enableKeepAlive: true, // Prevent cloud firewalls from dropping idle sockets
  keepAliveInitialDelay: 10000 // Send keep-alive packets every 10 seconds
} as any);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
