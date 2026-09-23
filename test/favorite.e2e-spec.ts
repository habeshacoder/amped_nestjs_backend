import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma, TEST_FIXTURE_PASSWORD } from './setup-e2e';
import { Genere, Parent, Type, Catagory } from '@prisma/client';

describe('Favorite End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let channelId: number;
  let materialId: number;
  let createdFavoriteId: number;

  const testUser = {
    email: 'favorite_e2e_user@example.com',
    password: TEST_FIXTURE_PASSWORD,
    passwordConfirm: TEST_FIXTURE_PASSWORD,
    username: 'favorite_e2e_user',
    phoneNo: '+12345678912',
  };

  beforeAll(async () => {
    await cleanDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Register user to get auth token
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser);
    authToken = signupRes.body.accessToken;

    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    userId = dbUser!.id;

    // Create seller profile, channel and material
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Favorite Test Seller',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Favorite Test Channel',
        description: 'Test Channel Desc',
        sellerProfile_id: seller.id,
      },
    });
    channelId = channel.id;

    const material = await prisma.material.create({
      data: {
        title: 'Favorite Test Material',
        description: 'Material Desc',
        sellerProfile_id: seller.id,
        price: 19.99,
        material: 'test-material.epub',
        genere: Genere.Unspecified,
        parent: Parent.Unspecified,
        type: Type.Unspecified,
        catagory: Catagory.Unspecified,
      },
    });
    materialId = material.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /favorite', () => {
    it('should reject unauthenticated favorite creation with 401', () => {
      return request(app.getHttpServer())
        .post('/favorite')
        .send({
          user_id: userId,
          channel_id: channelId,
        })
        .expect(401);
    });

    it('should reject favorite creation without user_id with 400', () => {
      return request(app.getHttpServer())
        .post('/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channel_id: channelId,
        })
        .expect(400);
    });

    it('should create favorite for channel with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: userId,
          channel_id: channelId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.user_id).toBe(userId);
      expect(res.body.channel_id).toBe(channelId);
      createdFavoriteId = res.body.id;

      // Verify in DB
      const dbFav = await prisma.favorite.findUnique({
        where: { id: createdFavoriteId },
      });
      expect(dbFav).toBeDefined();
      expect(dbFav?.channel_id).toBe(channelId);
    });

    it('should return already added message when favoriting duplicate', async () => {
      const res = await request(app.getHttpServer())
        .post('/favorite')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: userId,
          channel_id: channelId,
        })
        .expect(201);

      expect(res.body.message).toBe('Material already added in Favorite');
    });
  });

  describe('GET /favorite', () => {
    it('should return all favorites with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorite')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((f: any) => f.id === createdFavoriteId);
      expect(found).toBeDefined();
      expect(found.channel).toBeDefined();
    });
  });

  describe('GET /favorite/:id', () => {
    it('should return favorite by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/favorite/${createdFavoriteId}`)
        .expect(200);

      expect(res.body.id).toBe(createdFavoriteId);
      expect(res.body.user_id).toBe(userId);
    });

    it('should return null or empty when favorite not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorite/999999')
        .expect(200);

      expect(res.body).toEqual({});
    });
  });

  describe('GET /favorite/user/:user_id', () => {
    it('should return all favorites for specific user with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/favorite/user/${userId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].user_id).toBe(userId);
    });
  });

  describe('PATCH /favorite/:id', () => {
    it('should update favorite with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/favorite/${createdFavoriteId}`)
        .send({
          user_id: userId,
          material_id: materialId,
        })
        .expect(200);

      expect(res.body.id).toBe(createdFavoriteId);
      expect(res.body.material_id).toBe(materialId);
    });

    it('should return 403 when updating non-existent favorite', async () => {
      const res = await request(app.getHttpServer())
        .patch('/favorite/999999')
        .send({
          user_id: userId,
          material_id: materialId,
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /favorite/:id', () => {
    it('should return 403 when deleting non-existent favorite', async () => {
      const res = await request(app.getHttpServer())
        .delete('/favorite/999999')
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete favorite successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/favorite/${createdFavoriteId}`)
        .expect(200);

      expect(res.body.message).toBe('Favourite deleted successfully');

      // Verify removed from DB
      const dbFav = await prisma.favorite.findUnique({
        where: { id: createdFavoriteId },
      });
      expect(dbFav).toBeNull();
    });
  });
});
