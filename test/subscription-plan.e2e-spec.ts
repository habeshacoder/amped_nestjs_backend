import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma, TEST_FIXTURE_PASSWORD } from './setup-e2e';

describe('Subscription Plan End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let sellerProfileId: number;
  let channelId: number;
  let createdPlanId: number;

  const testUser = {
    email: 'subplan_e2e_user@example.com',
    password: TEST_FIXTURE_PASSWORD,
    passwordConfirm: TEST_FIXTURE_PASSWORD,
    username: 'subplan_e2e_user',
    phoneNo: '+12345678913',
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

    // Create seller and channel
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'SubPlan Test Seller',
        description: 'Seller Bio',
      },
    });
    sellerProfileId = seller.id;

    const channel = await prisma.channel.create({
      data: {
        name: 'SubPlan Test Channel',
        description: 'Channel Bio',
        sellerProfile_id: seller.id,
      },
    });
    channelId = channel.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /subscription-plan', () => {
    it('should reject unauthenticated creation with 401', () => {
      return request(app.getHttpServer())
        .post('/subscription-plan')
        .send({
          name: ['Monthly Access'],
          description: ['Full access for 30 days'],
          price: ['15'],
          channel_id: [channelId.toString()],
        })
        .expect(401);
    });

    it('should reject creation with invalid array payload with 400', () => {
      return request(app.getHttpServer())
        .post('/subscription-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Not An Array',
          description: ['Description'],
          price: ['15'],
          channel_id: [channelId.toString()],
        })
        .expect(400);
    });

    it('should create subscription plan with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/subscription-plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: ['Standard Plan'],
          description: ['Access to all materials in channel'],
          price: ['25'],
          channel_id: [channelId.toString()],
        })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const plan = res.body.find((p: any) => p.name === 'Standard Plan');
      expect(plan).toBeDefined();
      expect(plan.channel_id).toBe(channelId);
      createdPlanId = plan.id;

      // Verify in DB
      const dbPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: createdPlanId },
      });
      expect(dbPlan).toBeDefined();
      expect(dbPlan?.price).toBe(25);
    });
  });

  describe('GET /subscription-plan', () => {
    it('should return all subscription plans with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/subscription-plan')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((p: any) => p.id === createdPlanId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /subscription-plan/:id', () => {
    it('should return subscription plan by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/subscription-plan/${createdPlanId}`)
        .expect(200);

      expect(res.body.id).toBe(createdPlanId);
      expect(res.body.name).toBe('Standard Plan');
    });

    it('should return empty object when plan does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/subscription-plan/999999')
        .expect(200);

      expect(res.body).toEqual({});
    });
  });

  describe('GET /subscription-plan/getmaterials/:id', () => {
    it('should return materials in subscription plan with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/subscription-plan/getmaterials/${createdPlanId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /subscription-plan/channel/:id', () => {
    it('should return subscription plans for channel with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/subscription-plan/channel/${channelId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].channel_id).toBe(channelId);
    });
  });

  describe('GET /subscription-plan/seller/:id', () => {
    it('should return subscription plans for seller with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/subscription-plan/seller/${sellerProfileId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /subscription-plan/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/subscription-plan/${createdPlanId}`)
        .send({
          name: 'Updated Plan',
          description: 'Updated description',
          price: '30',
          channel_id: channelId.toString(),
        })
        .expect(401);
    });

    it('should update subscription plan with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/subscription-plan/${createdPlanId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Premium Plan',
          description: 'Updated premium access',
          price: '45',
          channel_id: channelId.toString(),
        })
        .expect(200);

      expect(res.body.id).toBe(createdPlanId);
      expect(res.body.name).toBe('Premium Plan');
      expect(res.body.price).toBe(45);
    });

    it('should return 403 when updating non-existent subscription plan', async () => {
      const res = await request(app.getHttpServer())
        .patch('/subscription-plan/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Non Existent',
          description: 'Desc',
          price: '10',
          channel_id: channelId.toString(),
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /subscription-plan/:id', () => {
    it('should return 403 when deleting non-existent subscription plan', async () => {
      const res = await request(app.getHttpServer())
        .delete('/subscription-plan/999999')
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete subscription plan successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/subscription-plan/${createdPlanId}`)
        .expect(200);

      expect(res.body.message).toBe('Subscription Plan deleted successfully');

      // Verify removed from DB
      const dbPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: createdPlanId },
      });
      expect(dbPlan).toBeNull();
    });
  });
});
