import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/amped_test?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'supersecrettestjwtkey1234567890';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'supersecrettestjwtrefreshkey1234567890';

// Run prisma migrate deploy before integration specs execute
execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env },
});

export const prisma = new PrismaClient();

export async function cleanDatabase(): Promise<void> {
  // Truncate all tables in dependency order with CASCADE to ensure clean state
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename NOT LIKE '_prisma_%';
  `;

  for (const { tablename } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`,
      );
    } catch {
      // Ignore individual truncate failures if table is locked or missing
    }
  }
}

afterAll(async () => {
  await prisma.$disconnect();
});
