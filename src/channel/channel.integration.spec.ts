import { prisma, cleanDatabase } from '../../test/setup-e2e';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('Channel Integration Tests (Real Prisma)', () => {
  let testUserId: string;
  let testSellerProfileId: number;

  beforeEach(async () => {
    await cleanDatabase();

    // Seed a prerequisite User and SellerProfile
    const user = await prisma.user.create({
      data: {
        username: 'channel_tester_' + Date.now(),
        email: `channel_tester_${Date.now()}@example.com`,
        password: 'hashed_password_123',
      },
    });
    testUserId = user.id;

    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        user_id: user.id,
        name: 'Channel Test Creator',
      },
    });
    testSellerProfileId = sellerProfile.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it('should successfully create and retrieve a channel with valid data', async () => {
    const channel = await prisma.channel.create({
      data: {
        name: 'Technology Today',
        description: 'A channel covering modern tech and development',
        draft: false,
        sellerProfile_id: testSellerProfileId,
      },
    });

    expect(channel).toBeDefined();
    expect(channel.id).toBeDefined();
    expect(channel.name).toBe('Technology Today');
    expect(channel.draft).toBe(false);
    expect(channel.sellerProfile_id).toBe(testSellerProfileId);

    const fetched = await prisma.channel.findUnique({
      where: { id: channel.id },
      include: { SellerProfile: true },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Technology Today');
    expect(fetched?.SellerProfile.id).toBe(testSellerProfileId);
  });

  it('should reject channel creation when sellerProfile_id does not exist (FK constraint)', async () => {
    const nonExistentSellerId = 9999999;

    await expect(
      prisma.channel.create({
        data: {
          name: 'Invalid Channel',
          sellerProfile_id: nonExistentSellerId,
        },
      }),
    ).rejects.toThrow(PrismaClientKnownRequestError);

    try {
      await prisma.channel.create({
        data: {
          name: 'Invalid Channel',
          sellerProfile_id: nonExistentSellerId,
        },
      });
      fail('Expected foreign key error was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2003');
    }
  });

  it('should enforce primary key uniqueness when duplicate id is inserted', async () => {
    const explicitId = 88888;
    await prisma.channel.create({
      data: {
        id: explicitId,
        name: 'Initial Channel',
        sellerProfile_id: testSellerProfileId,
      },
    });

    try {
      await prisma.channel.create({
        data: {
          id: explicitId,
          name: 'Conflicting Channel',
          sellerProfile_id: testSellerProfileId,
        },
      });
      fail('Expected unique constraint error was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });

  it('should enforce uniqueness constraint on user ratings for the same channel', async () => {
    const channel = await prisma.channel.create({
      data: {
        name: 'Rated Channel',
        sellerProfile_id: testSellerProfileId,
      },
    });

    // Create the first rating for this channel and user
    await prisma.rate.create({
      data: {
        user_id: testUserId,
        channel_id: channel.id,
        rating: 4.5,
        remark: 'Great content!',
      },
    });

    // Attempt to insert duplicate rating for the same user and channel
    try {
      await prisma.rate.create({
        data: {
          user_id: testUserId,
          channel_id: channel.id,
          rating: 5.0,
          remark: 'Duplicate review!',
        },
      });
      fail('Expected unique constraint error on channel rating was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });
});
