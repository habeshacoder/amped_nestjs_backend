import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma, TEST_FIXTURE_PASSWORD } from './setup-e2e';

describe('Social Links Channel End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let channelId: number;
  let createdLinkId: number;

  const testUser = {
    email: 'social_channel_e2e_user@example.com',
    password: TEST_FIXTURE_PASSWORD,
    passwordConfirm: TEST_FIXTURE_PASSWORD,
    username: 'social_channel_e2e_user',
    phoneNo: '+12345678918',
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

    // Create seller profile and channel
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Channel Social Seller',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Channel with Socials',
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

  describe('POST /social-links-channel', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/social-links-channel')
        .send({
          link: 'https://youtube.com/@channel',
          channel_id: channelId,
        })
        .expect(401);
    });

    it('should reject request missing required fields with 400', () => {
      return request(app.getHttpServer())
        .post('/social-links-channel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channel_id: channelId,
        })
        .expect(400);
    });

    it('should create social link for channel with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/social-links-channel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://youtube.com/@channel',
          channel_id: channelId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.link).toBe('https://youtube.com/@channel');
      expect(res.body.channel_id).toBe(channelId);
      createdLinkId = res.body.id;

      // Verify in DB
      const dbLink = await prisma.socialLinksChannel.findUnique({
        where: { id: createdLinkId },
      });
      expect(dbLink).toBeDefined();
      expect(dbLink?.link).toBe('https://youtube.com/@channel');
    });
  });

  describe('GET /social-links-channel', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get('/social-links-channel')
        .expect(401);
    });

    it('should return all social link channels with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/social-links-channel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((l: any) => l.id === createdLinkId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /social-links-channel/:id', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get(`/social-links-channel/${createdLinkId}`)
        .expect(401);
    });

    it('should return social link by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/social-links-channel/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdLinkId);
      expect(res.body.link).toBe('https://youtube.com/@channel');
    });

    it('should return empty object or null when not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/social-links-channel/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toEqual({});
    });
  });

  describe('GET /social-links-channel/profile/:id', () => {
    it('should return social link for profile route with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/social-links-channel/profile/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdLinkId);
    });
  });

  describe('PATCH /social-links-channel/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/social-links-channel/${createdLinkId}`)
        .send({
          link: 'https://youtube.com/@channel_updated',
          channel_id: channelId,
        })
        .expect(401);
    });

    it('should update social link with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/social-links-channel/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://youtube.com/@channel_updated',
          channel_id: channelId,
        })
        .expect(200);

      expect(res.body.id).toBe(createdLinkId);
      expect(res.body.link).toBe('https://youtube.com/@channel_updated');
    });

    it('should return 403 when updating non-existent social link', async () => {
      const res = await request(app.getHttpServer())
        .patch('/social-links-channel/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://youtube.com/@ghost',
          channel_id: channelId,
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /social-links-channel/:id', () => {
    it('should reject unauthenticated delete with 401', () => {
      return request(app.getHttpServer())
        .delete(`/social-links-channel/${createdLinkId}`)
        .expect(401);
    });

    it('should return 403 when deleting non-existent social link', async () => {
      const res = await request(app.getHttpServer())
        .delete('/social-links-channel/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete social link successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/social-links-channel/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Social link deleted successfully');

      // Verify removed from DB
      const dbLink = await prisma.socialLinksChannel.findUnique({
        where: { id: createdLinkId },
      });
      expect(dbLink).toBeNull();
    });
  });
});
