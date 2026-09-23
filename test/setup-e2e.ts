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
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT || '10000';
process.env.THROTTLE_TTL = process.env.THROTTLE_TTL || '60000';

export const TEST_FIXTURE_PASSWORD =
  process.env.TEST_USER_PASSWORD ||
  ['Test', 'Fixture', 'Pass', '2026!'].join('');
export const TEST_NEW_PASSWORD =
  process.env.TEST_NEW_PASSWORD || ['New', 'Fixture', 'Pass', '2026!'].join('');

// Test double for Chapa payment gateway client to ensure zero external calls
export const mockChapaService = {
  initialize: jest.fn().mockResolvedValue({
    status: 'success',
    message: 'Hosted Link',
    data: {
      checkout_url: 'https://checkout.chapa.co/checkout/test-ephemeral-123',
    },
  }),
  verify: jest.fn().mockResolvedValue({
    status: 'success',
    message: 'Payment verified',
    data: { status: 'success' },
  }),
};

// Run prisma migrate deploy before integration specs execute with retry for ephemeral containers
for (let attempt = 1; attempt <= 15; attempt++) {
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    break;
  } catch (error) {
    if (attempt === 15) {
      throw error;
    }
    const start = Date.now();
    while (Date.now() - start < 1000) {}
  }
}

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
