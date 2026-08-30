import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const dbUrlString = process.env.DATABASE_URL || 'mysql://root:rootpassword@localhost:3306/ask_insurance';

function createPrismaClient(): PrismaClient {
  const url = new URL(dbUrlString);
  const host = url.hostname.toLowerCase();
  const isAiven = host === 'aivencloud.com' ||
                  host.endsWith('.aivencloud.com') ||
                  host === 'aiven.io' ||
                  host.endsWith('.aiven.io');
  const isSsl = url.searchParams.get('ssl-mode') === 'REQUIRED' ||
                url.searchParams.get('ssl') === 'true' ||
                isAiven ||
                process.env.DATABASE_SSL === 'true';

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined
  } as any);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
