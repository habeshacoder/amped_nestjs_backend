import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, mockChapaService, prisma } from './setup-e2e';
import { ChapaService } from 'chapa-nestjs';

describe('Seller Profiles End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let createdSellerProfileId: number;

  const testUser = {
    email: 'seller_profile_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'seller_profile_e2e_user',
    phoneNo: '+12345678911',
  };

  beforeAll(async () => {
    await cleanDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChapaService)
      .useValue(mockChapaService)
      .compile();

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /seller-profiles', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/seller-profiles')
        .field('name', 'Artisan Store')
        .field('description', 'Handcrafted goods')
        .field('sex', 'Male')
        .expect(401);
    });

    it('should reject creation with missing required name with 400', () => {
      return request(app.getHttpServer())
        .post('/seller-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('description', 'Handcrafted goods')
        .field('sex', 'Male')
        .expect(400);
    });

    it('should reject creation with invalid sex enum with 400', () => {
      return request(app.getHttpServer())
        .post('/seller-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Artisan Store')
        .field('sex', 'InvalidSex')
        .expect(400);
    });

    it('should create seller profile successfully with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/seller-profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Artisan Books')
        .field('description', 'Quality books seller')
        .field('sex', 'Female')
        .field('date_of_birth', '1985-05-15')
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.name).toBe('Artisan Books');
      expect(res.body.description).toBe('Quality books seller');
      expect(res.body.user_id).toBe(userId);
      createdSellerProfileId = res.body.id;

      // Verify in DB
      const dbSeller = await prisma.sellerProfile.findUnique({
        where: { id: createdSellerProfileId },
      });
      expect(dbSeller).toBeDefined();
      expect(dbSeller?.name).toBe('Artisan Books');
    });
  });

  describe('GET /seller-profiles', () => {
    it('should return all seller profiles with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller-profiles')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((s: any) => s.id === createdSellerProfileId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /seller-profiles/me', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get('/seller-profiles/me')
        .expect(401);
    });

    it('should return seller profiles of current user with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller-profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((s: any) => s.id === createdSellerProfileId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Artisan Books');
      expect(found.user_id).toBe(userId);
    });
  });

  describe('GET /seller-profiles/:id', () => {
    it('should return seller profile by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/seller-profiles/${createdSellerProfileId}`)
        .expect(200);

      expect(res.body.id).toBe(createdSellerProfileId);
      expect(res.body.name).toBe('Artisan Books');
    });

    it('should return 404 when seller profile not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/seller-profiles/999999')
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });
  });

  describe('PATCH /seller-profiles/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/seller-profiles/${createdSellerProfileId}`)
        .send({
          name: 'Updated Artisan Books',
          description: 'Updated bio',
          sex: 'Female',
        })
        .expect(401);
    });

    it('should update seller profile with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/seller-profiles/${createdSellerProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Artisan Books',
          description: 'Updated bio description',
          sex: 'Female',
          date_of_birth: '1985-05-15',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Artisan Books');
      expect(res.body.description).toBe('Updated bio description');
    });

    it('should return 404 when updating non-existent seller profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/seller-profiles/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Non Existent',
          sex: 'Male',
        })
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });
  });

  describe('DELETE /seller-profiles/:id', () => {
    it('should return 404 when deleting non-existent seller profile', async () => {
      const res = await request(app.getHttpServer())
        .delete('/seller-profiles/999999')
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });

    it('should delete seller profile successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/seller-profiles/${createdSellerProfileId}`)
        .expect(200);

      expect(res.body.message).toBe('Seller Profile deleted successfully');

      // Verify removed from DB
      const dbSeller = await prisma.sellerProfile.findUnique({
        where: { id: createdSellerProfileId },
      });
      expect(dbSeller).toBeNull();
    });
  });
});
