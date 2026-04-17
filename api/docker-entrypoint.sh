#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy

echo "Checking if database needs seeding..."
COUNT=$(node -e "
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('./dist/generated/prisma/client');
const url = new URL(process.env.DATABASE_URL);
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
")

if [ "$COUNT" = "0" ]; then
  echo "Database is empty — running seed..."
  npx prisma db seed
  echo "Seed complete."
else
  echo "Database already has data (${COUNT} insurers) — skipping seed."
fi

echo "Starting API server..."
exec node dist/index.js
