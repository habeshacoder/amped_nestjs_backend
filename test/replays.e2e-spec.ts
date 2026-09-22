import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';

describe('Replays End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let remarkId: number;
  let createdReplayId: number;

  const testUser = {
    email: 'replays_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'replays_e2e_user',
    phoneNo: '+12345678916',
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

    // Create seller, channel, and rate with remark
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Replays Test Seller',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Replays Test Channel',
        description: 'Channel Bio',
        sellerProfile_id: seller.id,
      },
    });

    const rate = await prisma.rate.create({
      data: {
        user_id: userId,
        channel_id: channel.id,
        rating: 5,
        remark: 'Initial Remark on Channel',
      },
    });
    remarkId = rate.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /replays', () => {
    it('should reject unauthenticated replay creation with 401', () => {
      return request(app.getHttpServer())
        .post('/replays')
        .send({
          replay: 'Thank you for your feedback!',
          remark_id: remarkId,
        })
        .expect(401);
    });

    it('should reject creation without required fields with 400', () => {
      return request(app.getHttpServer())
        .post('/replays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          remark_id: remarkId,
        })
        .expect(400);
    });

    it('should create replay for remark with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/replays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          replay: 'Thank you for your kind remark!',
          remark_id: remarkId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.remark_id).toBe(remarkId);
      expect(res.body.replay).toBe('Thank you for your kind remark!');
      createdReplayId = res.body.id;

      // Verify in DB
      const dbReplay = await prisma.replay.findUnique({
        where: { id: createdReplayId },
      });
      expect(dbReplay).toBeDefined();
      expect(dbReplay?.remark_id).toBe(remarkId);
    });

    it('should reject multiple replays on same remark with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/replays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          replay: 'Second replay on remark',
          remark_id: remarkId,
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('GET /replays', () => {
    it('should return all replays with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/replays')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((r: any) => r.id === createdReplayId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /replays/:id', () => {
    it('should return replay by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/replays/${createdReplayId}`)
        .expect(200);

      expect(res.body.id).toBe(createdReplayId);
      expect(res.body.remark_id).toBe(remarkId);
    });

    it('should return message when replay does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/replays/999999')
        .expect(200);

      expect(res.body.message).toBe('No replay found.');
    });
  });

  describe('GET /replays/remark/:remark_id', () => {
    it('should return replay for specified remark_id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/replays/remark/${remarkId}`)
        .expect(200);

      expect(res.body.id).toBe(createdReplayId);
      expect(res.body.remark_id).toBe(remarkId);
    });
  });

  describe('GET /replays/check_replay/:remark_id', () => {
    it('should return replay by remark_id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/replays/check_replay/${remarkId}`)
        .expect(200);

      expect(res.body.id).toBe(createdReplayId);
      expect(res.body.remark_id).toBe(remarkId);
    });
  });

  describe('GET /replays/replay_for_remark/:remark_id', () => {
    it('should return paired remark and replay with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/replays/replay_for_remark/${remarkId}`)
        .expect(200);

      expect(res.body.remark).toBe('Initial Remark on Channel');
      expect(res.body.replay).toBe('Thank you for your kind remark!');
    });
  });

  describe('PATCH /replays/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/replays/${createdReplayId}`)
        .send({
          replay: 'Updated replay text',
        })
        .expect(401);
    });

    it('should update replay with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/replays/${createdReplayId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          replay: 'Updated replay message',
        })
        .expect(200);

      expect(res.body.id).toBe(createdReplayId);
      expect(res.body.replay).toBe('Updated replay message');
    });

    it('should return 403 when updating non-existent replay', async () => {
      const res = await request(app.getHttpServer())
        .patch('/replays/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          replay: 'Ghost replay',
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /replays/:id', () => {
    it('should return 403 when deleting non-existent replay', async () => {
      const res = await request(app.getHttpServer())
        .delete('/replays/999999')
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete replay successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/replays/${createdReplayId}`)
        .expect(200);

      expect(res.body.message).toBe('Replay deleted successfully');

      // Verify removed from DB
      const dbReplay = await prisma.replay.findUnique({
        where: { id: createdReplayId },
      });
      expect(dbReplay).toBeNull();
    });
  });
});
