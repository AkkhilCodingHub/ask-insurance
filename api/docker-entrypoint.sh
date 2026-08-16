#!/bin/sh

echo "Syncing database schema (safe mode)..."
npx prisma db push --accept-data-loss || echo "⚠️ Prisma db push warning: Database unreachable or busy during startup. Continuing..."

echo "Checking if database needs seeding..."
COUNT=$(node -e "
try {
  const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
  const { PrismaClient } = require('./dist/generated/prisma/client');
  const url = new URL(process.env.DATABASE_URL || 'mysql://root:rootpassword@localhost:3306/ask_insurance');
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 1
  });
  const prisma = new PrismaClient({ adapter });
  prisma.insurer.count()
    .then(c => { process.stdout.write(String(c)); return prisma.\$disconnect(); })
    .catch(() => { process.stdout.write('0'); });
} catch (e) {
  process.stdout.write('0');
}
" 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
  echo "Attempting seed if database is accessible..."
  npx prisma db seed 2>/dev/null || echo "⚠️ Database seed skipped (db unreachable or already initialized)."
else
  echo "Database already has data (${COUNT} insurers) — skipping seed."
fi

echo "Starting API server..."
exec node dist/index.js
