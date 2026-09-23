import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma, TEST_FIXTURE_PASSWORD } from './setup-e2e';
import { Parent, Type, Genere, Catagory } from '@prisma/client';

describe('Rating End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let materialId: number;
  let createdRatingId: number;

  const testUser = {
    email: 'rating_e2e_user@example.com',
    password: TEST_FIXTURE_PASSWORD,
    passwordConfirm: TEST_FIXTURE_PASSWORD,
    username: 'rating_e2e_user',
    phoneNo: '+12345678904',
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

    // Register user to obtain JWT token
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser);
    authToken = signupRes.body.accessToken;

    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    // Create seller profile
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: dbUser!.id,
        name: 'Rating Seller',
        description: 'Seller for ratings',
      },
    });

    // Create a target material to rate
    const material = await prisma.material.create({
      data: {
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Unspecified,
        catagory: Catagory.Fiction,
        title: 'Book To Rate',
        material: 'null',
        sellerProfile_id: seller.id,
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

  describe('POST /rate', () => {
    it('should reject unauthenticated rating submission with 401', () => {
      return request(app.getHttpServer())
        .post('/rate')
        .send({
          rating: 5,
          remark: 'Excellent content!',
          material_id: materialId,
        })
        .expect(401);
    });

    it('should reject invalid payload with 400', () => {
      return request(app.getHttpServer())
        .post('/rate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // missing rating and remark
          material_id: materialId,
        })
        .expect(400);
    });

    it('should create a new rating in PostgreSQL with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/rate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          remark: 'Masterpiece publication',
          material_id: materialId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.rating).toBe(5);
      expect(res.body.remark).toBe('Masterpiece publication');
      createdRatingId = res.body.id;

      // Verify in PostgreSQL
      const dbRating = await prisma.rate.findUnique({
        where: { id: createdRatingId },
      });
      expect(dbRating).toBeDefined();
      expect(dbRating?.rating).toBe(5);
    });

    it('should reject duplicate rating for same material and user with 409 Conflict', () => {
      return request(app.getHttpServer())
        .post('/rate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          remark: 'Second attempt should fail',
          material_id: materialId,
        })
        .expect(409);
    });
  });

  describe('GET /rate', () => {
    it('should return list of ratings with 200', async () => {
      const res = await request(app.getHttpServer()).get('/rate').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((r: any) => r.id === createdRatingId);
      expect(found).toBeDefined();
      expect(found.remark).toBe('Masterpiece publication');
    });

    it('should return single rating by ID with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/rate/review/${createdRatingId}`)
        .expect(200);

      expect(res.body.id).toBe(createdRatingId);
      expect(res.body.rating).toBe(5);
    });

    it('should return 404 for non-existent rating ID', () => {
      return request(app.getHttpServer())
        .get('/rate/review/999999')
        .expect(404);
    });

    it('should return user review via GET /rate/my_review with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/rate/my_review')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate material rating via GET /rate/material/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/rate/material/${materialId}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('PATCH /rate/:id', () => {
    it('should update rating in PostgreSQL with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/rate/${createdRatingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          remark: 'Updated review remark',
        })
        .expect(200);

      expect(res.body.rating).toBe(4);
      expect(res.body.remark).toBe('Updated review remark');

      // Verify in PostgreSQL
      const dbRating = await prisma.rate.findUnique({
        where: { id: createdRatingId },
      });
      expect(dbRating?.rating).toBe(4);
    });

    it('should return 404 when updating non-existent rating', () => {
      return request(app.getHttpServer())
        .patch('/rate/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 3,
          remark: 'Non-existent',
        })
        .expect(404);
    });
  });

  describe('DELETE /rate/:id', () => {
    it('should delete rating in PostgreSQL with 200', async () => {
      await request(app.getHttpServer())
        .delete(`/rate/${createdRatingId}`)
        .expect(200);

      // Verify deleted from PostgreSQL
      const dbRating = await prisma.rate.findUnique({
        where: { id: createdRatingId },
      });
      expect(dbRating).toBeNull();
    });

    it('should return 404 when deleting already deleted rating', () => {
      return request(app.getHttpServer())
        .delete(`/rate/${createdRatingId}`)
        .expect(404);
    });
  });
});
