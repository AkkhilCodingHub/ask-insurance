import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../generated/prisma/client';

const dbUrlString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ask_insurance';

function createPrismaClient(): PrismaClient {
  if (dbUrlString.startsWith('mysql://') || dbUrlString.startsWith('mariadb://')) {
    const url = new URL(dbUrlString);
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, ''),
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
      connectTimeout: 5000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    } as any);
    return new PrismaClient({ adapter });
  }

  // PostgreSQL (Supabase / Neon) Driver Adapter with PgBouncer Connection Pooling
  const pool = new pg.Pool({ connectionString: dbUrlString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
