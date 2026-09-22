import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';

describe('Subscribed Users End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let subscriptionPlanId: number;
  let createdSubscribedUserId: number;

  const testUser = {
    email: 'sub_user_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'sub_user_e2e_user',
    phoneNo: '+12345678914',
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

    // Create seller, channel, and subscription plan
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Subscriber Test Seller',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Subscriber Test Channel',
        description: 'Channel Bio',
        sellerProfile_id: seller.id,
      },
    });

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Monthly Pass',
        description: 'Monthly Pass Desc',
        price: 20,
        channel_id: channel.id,
      },
    });
    subscriptionPlanId = plan.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /subscribed-users', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/subscribed-users')
        .send({
          subscription_id: subscriptionPlanId,
          name: 'Subscriber One',
        })
        .expect(401);
    });

    it('should reject request missing required fields with 400', () => {
      return request(app.getHttpServer())
        .post('/subscribed-users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Request',
        })
        .expect(400);
    });

    it('should create subscribed-user record with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscribed-users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscription_id: subscriptionPlanId,
          name: 'Subscriber One',
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.user_id).toBe(userId);
      expect(res.body.subscription_id).toBe(subscriptionPlanId);
      createdSubscribedUserId = res.body.id;

      // Verify in DB
      const dbSub = await prisma.subscribedUser.findUnique({
        where: { id: createdSubscribedUserId },
      });
      expect(dbSub).toBeDefined();
      expect(dbSub?.subscription_id).toBe(subscriptionPlanId);
    });

    it('should reject duplicate subscription for same user with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscribed-users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subscription_id: subscriptionPlanId,
          name: 'Duplicate Subscription',
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('GET /subscribed-users', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer()).get('/subscribed-users').expect(401);
    });

    it('should return list of subscribed users with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/subscribed-users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((s: any) => s.id === createdSubscribedUserId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /subscribed-users/:id', () => {
    it('should return subscribed user by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/subscribed-users/${createdSubscribedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdSubscribedUserId);
      expect(res.body.subscription_id).toBe(subscriptionPlanId);
    });

    it('should return message when subscribed user not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/subscribed-users/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('No subscribed user found.');
    });
  });

  describe('PATCH /subscribed-users/:id', () => {
    it('should update subscribed user with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/subscribed-users/${createdSubscribedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Subscriber' })
        .expect(200);

      expect(res.body.id).toBe(createdSubscribedUserId);
    });

    it('should return 403 when updating non-existent subscribed user', async () => {
      const res = await request(app.getHttpServer())
        .patch('/subscribed-users/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Subscriber' })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /subscribed-users/:id', () => {
    it('should return 403 when deleting non-existent subscribed user', async () => {
      const res = await request(app.getHttpServer())
        .delete('/subscribed-users/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete subscribed user successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/subscribed-users/${createdSubscribedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Subscribed User deleted successfully');

      // Verify removed from DB
      const dbSub = await prisma.subscribedUser.findUnique({
        where: { id: createdSubscribedUserId },
      });
      expect(dbSub).toBeNull();
    });
  });
});
