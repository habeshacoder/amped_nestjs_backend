import { prisma, cleanDatabase } from '../../test/setup-e2e';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Catagory, Genere, Parent, Type } from '@prisma/client';

describe('Material Integration Tests (Real Prisma)', () => {
  let testUserId: string;
  let testSellerProfileId: number;

  beforeEach(async () => {
    await cleanDatabase();

    const user = await prisma.user.create({
      data: {
        username: 'material_tester_' + Date.now(),
        email: `material_tester_${Date.now()}@example.com`,
        password: 'hashed_password_123',
      },
    });
    testUserId = user.id;

    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        user_id: user.id,
        name: 'Material Test Publisher',
      },
    });
    testSellerProfileId = sellerProfile.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  it('should successfully create and fetch a material with valid data', async () => {
    const material = await prisma.material.create({
      data: {
        title: 'Mastering NestJS & Prisma',
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Psycology,
        catagory: Catagory.Documentary,
        author: 'John Doe',
        price: 29.99,
        length_page: 350,
        length_minute: 0,
        material: 'uploads/materials/sample_book.pdf',
        sellerProfile_id: testSellerProfileId,
      },
    });

    expect(material).toBeDefined();
    expect(material.id).toBeDefined();
    expect(material.title).toBe('Mastering NestJS & Prisma');
    expect(material.price).toBe(29.99);
    expect(material.sellerProfile_id).toBe(testSellerProfileId);

    const fetched = await prisma.material.findUnique({
      where: { id: material.id },
      include: { SellerProfile: true },
    });

    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('Mastering NestJS & Prisma');
    expect(fetched?.SellerProfile.name).toBe('Material Test Publisher');
  });

  it('should reject material creation when sellerProfile_id does not exist (FK constraint)', async () => {
    const nonExistentSellerId = 9999999;

    try {
      await prisma.material.create({
        data: {
          title: 'Invalid Foreign Key Book',
          material: 'null',
          sellerProfile_id: nonExistentSellerId,
        },
      });
      fail('Expected foreign key error was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2003');
    }
  });

  it('should enforce primary key uniqueness on materials table', async () => {
    const explicitId = 77777;
    await prisma.material.create({
      data: {
        id: explicitId,
        title: 'Original Title',
        material: 'null',
        sellerProfile_id: testSellerProfileId,
      },
    });

    try {
      await prisma.material.create({
        data: {
          id: explicitId,
          title: 'Colliding Title',
          material: 'null',
          sellerProfile_id: testSellerProfileId,
        },
      });
      fail('Expected unique constraint error was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });

  it('should reject material with negative price violating check constraint', async () => {
    try {
      await prisma.material.create({
        data: {
          title: 'Negative Price Material',
          price: -15.0,
          material: 'null',
          sellerProfile_id: testSellerProfileId,
        },
      });
      fail('Expected check constraint error for negative price was not thrown');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it('should enforce composite uniqueness constraint on material_user table', async () => {
    const material = await prisma.material.create({
      data: {
        title: 'Paid Exclusive Course',
        material: 'course.pdf',
        price: 19.99,
        sellerProfile_id: testSellerProfileId,
      },
    });

    // Grant access to the user
    await prisma.materialUser.create({
      data: {
        user_id: testUserId,
        material_id: material.id,
        is_paied: true,
      },
    });

    // Attempting to grant access again for the same user and material should violate @@unique([user_id, material_id])
    try {
      await prisma.materialUser.create({
        data: {
          user_id: testUserId,
          material_id: material.id,
          is_paied: true,
        },
      });
      fail(
        'Expected unique constraint violation on material_user was not thrown',
      );
    } catch (err) {
      expect(err).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((err as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });
});
