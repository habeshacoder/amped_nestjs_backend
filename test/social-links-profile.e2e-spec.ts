import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma, TEST_FIXTURE_PASSWORD } from './setup-e2e';

describe('Social Links Profile End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let sellerProfileId: number;
  let createdLinkId: number;

  const testUser = {
    email: 'social_profile_e2e_user@example.com',
    password: TEST_FIXTURE_PASSWORD,
    passwordConfirm: TEST_FIXTURE_PASSWORD,
    username: 'social_profile_e2e_user',
    phoneNo: '+12345678917',
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

    // Create seller profile
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Social Seller',
        description: 'Seller Bio',
      },
    });
    sellerProfileId = seller.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /social-links-profile', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/social-links-profile')
        .send({
          link: 'https://twitter.com/seller',
          sellerProfile_id: sellerProfileId,
        })
        .expect(401);
    });

    it('should reject request missing required fields with 400', () => {
      return request(app.getHttpServer())
        .post('/social-links-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sellerProfile_id: sellerProfileId,
        })
        .expect(400);
    });

    it('should create social link for profile with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/social-links-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://twitter.com/seller',
          sellerProfile_id: sellerProfileId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.link).toBe('https://twitter.com/seller');
      expect(res.body.sellerProfile_id).toBe(sellerProfileId);
      createdLinkId = res.body.id;

      // Verify in DB
      const dbLink = await prisma.socialLinksProfile.findUnique({
        where: { id: createdLinkId },
      });
      expect(dbLink).toBeDefined();
      expect(dbLink?.link).toBe('https://twitter.com/seller');
    });
  });

  describe('GET /social-links-profile', () => {
    it('should return all social link profiles with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/social-links-profile')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((l: any) => l.id === createdLinkId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /social-links-profile/:id', () => {
    it('should return social link by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/social-links-profile/${createdLinkId}`)
        .expect(200);

      expect(res.body.id).toBe(createdLinkId);
      expect(res.body.link).toBe('https://twitter.com/seller');
    });

    it('should return empty object or null when not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/social-links-profile/999999')
        .expect(200);

      expect(res.body).toEqual({});
    });
  });

  describe('GET /social-links-profile/seller_profile/:sellerprofile_id', () => {
    it('should return social links for seller profile with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/social-links-profile/seller_profile/${sellerProfileId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].sellerProfile_id).toBe(sellerProfileId);
    });
  });

  describe('PATCH /social-links-profile/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/social-links-profile/${createdLinkId}`)
        .send({
          link: 'https://x.com/seller',
          sellerProfile_id: sellerProfileId,
        })
        .expect(401);
    });

    it('should update social link with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/social-links-profile/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://x.com/seller_updated',
          sellerProfile_id: sellerProfileId,
        })
        .expect(200);

      expect(res.body.id).toBe(createdLinkId);
      expect(res.body.link).toBe('https://x.com/seller_updated');
    });

    it('should return 403 when updating non-existent social link', async () => {
      const res = await request(app.getHttpServer())
        .patch('/social-links-profile/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          link: 'https://x.com/ghost',
          sellerProfile_id: sellerProfileId,
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('DELETE /social-links-profile/:id', () => {
    it('should reject unauthenticated delete with 401', () => {
      return request(app.getHttpServer())
        .delete(`/social-links-profile/${createdLinkId}`)
        .expect(401);
    });

    it('should return 403 when deleting non-existent social link', async () => {
      const res = await request(app.getHttpServer())
        .delete('/social-links-profile/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete social link successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/social-links-profile/${createdLinkId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Social link deleted successfully');

      // Verify removed from DB
      const dbLink = await prisma.socialLinksProfile.findUnique({
        where: { id: createdLinkId },
      });
      expect(dbLink).toBeNull();
    });
  });
});
