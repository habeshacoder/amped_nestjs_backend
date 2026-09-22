import { prisma, cleanDatabase } from '../../test/setup-e2e';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('Rating Integration Tests (Real Prisma)', () => {
  let testUserId: string;
  let secondUserId: string;
  let testSellerProfileId: number;
  let testMaterialId: number;
  let testChannelId: number;

  beforeEach(async () => {
    await cleanDatabase();

    // Create primary user
    const user = await prisma.user.create({
      data: {
        username: 'rating_tester_' + Date.now(),
        email: `rating_tester_${Date.now()}@example.com`,
        password: 'hashed_password_123',
      },
    });
    testUserId = user.id;

    // Create second user to verify multi-user ratings
    const user2 = await prisma.user.create({
      data: {
        username: 'rating_tester_2_' + Date.now(),
        email: `rating_tester_2_${Date.now()}@example.com`,
        password: 'hashed_password_123',
      },
    });
    secondUserId = user2.id;

    // Create seller profile
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: user.id,
        name: 'Reviewable Creator',
      },
    });
    testSellerProfileId = seller.id;

    // Create a material
    const material = await prisma.material.create({
      data: {
        title: 'Book for Ratings Test',
        material: 'content.pdf',
        price: 9.99,
        sellerProfile_id: testSellerProfileId,
      },
    });
    testMaterialId = material.id;

    // Create a channel
    const channel = await prisma.channel.create({
      data: {
        name: 'Channel for Ratings Test',
        sellerProfile_id: testSellerProfileId,
      },
    });
    testChannelId = channel.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it('should successfully create and fetch ratings for material and channel', async () => {
    const materialRating = await prisma.rate.create({
      data: {
        user_id: testUserId,
        material_id: testMaterialId,
        rating: 4.5,
        remark: 'Exceptional quality content!',
      },
    });

    expect(materialRating).toBeDefined();
    expect(materialRating.id).toBeDefined();
    expect(materialRating.rating).toBe(4.5);
    expect(materialRating.remark).toBe('Exceptional quality content!');
    expect(materialRating.material_id).toBe(testMaterialId);

    const channelRating = await prisma.rate.create({
      data: {
        user_id: testUserId,
        channel_id: testChannelId,
        rating: 5.0,
        remark: 'Best creator channel on the platform.',
      },
    });

    expect(channelRating).toBeDefined();
    expect(channelRating.rating).toBe(5.0);
    expect(channelRating.channel_id).toBe(testChannelId);
  });

  it('should enforce composite uniqueness constraint on (user_id, material_id)', async () => {
    await prisma.rate.create({
      data: {
        user_id: testUserId,
        material_id: testMaterialId,
        rating: 4.0,
        remark: 'First review',
      },
    });

    try {
      await prisma.rate.create({
        data: {
          user_id: testUserId,
          material_id: testMaterialId,
          rating: 5.0,
          remark: 'Second review on the same material',
        },
      });
      fail(
        'Expected unique constraint error on material rating was not thrown',
      );
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });

  it('should enforce composite uniqueness constraint on (user_id, channel_id)', async () => {
    await prisma.rate.create({
      data: {
        user_id: testUserId,
        channel_id: testChannelId,
        rating: 4.0,
        remark: 'First channel review',
      },
    });

    try {
      await prisma.rate.create({
        data: {
          user_id: testUserId,
          channel_id: testChannelId,
          rating: 3.0,
          remark: 'Second channel review by same user',
        },
      });
      fail('Expected unique constraint error on channel rating was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });

  it('should reject rating values outside the 0 to 5 range (check constraint)', async () => {
    // Rating > 5
    try {
      await prisma.rate.create({
        data: {
          user_id: testUserId,
          material_id: testMaterialId,
          rating: 6.5,
          remark: 'Invalid rating above 5',
        },
      });
      fail('Expected check constraint error for rating > 5 was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }

    // Rating < 0
    try {
      await prisma.rate.create({
        data: {
          user_id: testUserId,
          material_id: testMaterialId,
          rating: -1.0,
          remark: 'Invalid rating below 0',
        },
      });
      fail('Expected check constraint error for rating < 0 was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('should allow different users to rate the same material independently', async () => {
    const rate1 = await prisma.rate.create({
      data: {
        user_id: testUserId,
        material_id: testMaterialId,
        rating: 4.0,
        remark: 'Review by User 1',
      },
    });

    const rate2 = await prisma.rate.create({
      data: {
        user_id: secondUserId,
        material_id: testMaterialId,
        rating: 5.0,
        remark: 'Review by User 2',
      },
    });

    expect(rate1.id).not.toEqual(rate2.id);
    const allRatings = await prisma.rate.findMany({
      where: { material_id: testMaterialId },
    });
    expect(allRatings.length).toBe(2);
  });
});
