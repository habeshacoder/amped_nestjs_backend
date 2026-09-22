import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';

describe('Channel End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let sellerProfileId: number;
  let createdChannelId: number;

  const testUser = {
    email: 'channel_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'channel_e2e_user',
    phoneNo: '+12345678902',
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

    // Create a seller profile for this user
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: dbUser!.id,
        name: 'Channel Creator',
        description: 'Channel Creator Bio',
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

  describe('POST /channel', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/channel')
        .send({
          name: 'Unauthorized Channel',
          description: 'Desc',
          sellerProfile_id: String(sellerProfileId),
        })
        .expect(401);
    });

    it('should reject invalid channel payload with 400', () => {
      return request(app.getHttpServer())
        .post('/channel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing fields',
        })
        .expect(400);
    });

    it('should create a new channel in PostgreSQL with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/channel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Tech Insights Channel',
          description: 'Technology reviews and insights',
          sellerProfile_id: String(sellerProfileId),
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Tech Insights Channel');
      expect(res.body.sellerProfile_id).toBe(sellerProfileId);
      createdChannelId = res.body.id;

      // Verify record exists in PostgreSQL
      const dbChannel = await prisma.channel.findUnique({
        where: { id: createdChannelId },
      });
      expect(dbChannel).toBeDefined();
      expect(dbChannel?.name).toBe('Tech Insights Channel');
    });

    it('should reject channel creation with invalid foreign key seller profile', () => {
      return request(app.getHttpServer())
        .post('/channel')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid FK Channel',
          description: 'Non-existent seller',
          sellerProfile_id: '999999',
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('GET /channel', () => {
    it('should return list of all channels with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/channel')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((c: any) => c.id === createdChannelId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Tech Insights Channel');
    });

    it('should return channel by ID with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/channel/${createdChannelId}`)
        .expect(200);

      expect(res.body.id).toBe(createdChannelId);
      expect(res.body.name).toBe('Tech Insights Channel');
    });

    it('should return 404 for invalid pagination page', () => {
      return request(app.getHttpServer())
        .get('/channel/paginate_channels?page=999&take=10')
        .expect(404);
    });
  });

  describe('PATCH /channel/:id', () => {
    it('should update channel in PostgreSQL with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/channel/${createdChannelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Tech Channel',
          description: 'Updated Description',
          sellerProfile_id: String(sellerProfileId),
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Tech Channel');

      // Verify in PostgreSQL
      const dbChannel = await prisma.channel.findUnique({
        where: { id: createdChannelId },
      });
      expect(dbChannel?.name).toBe('Updated Tech Channel');
    });

    it('should return 404 when updating non-existent channel', () => {
      return request(app.getHttpServer())
        .patch('/channel/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Ghost Channel',
          sellerProfile_id: String(sellerProfileId),
        })
        .expect(404);
    });
  });

  describe('DELETE /channel/:id', () => {
    it('should delete channel in PostgreSQL with 200', async () => {
      await request(app.getHttpServer())
        .delete(`/channel/${createdChannelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify record is gone from PostgreSQL
      const dbChannel = await prisma.channel.findUnique({
        where: { id: createdChannelId },
      });
      expect(dbChannel).toBeNull();
    });

    it('should return 404 when deleting already deleted channel', () => {
      return request(app.getHttpServer())
        .delete(`/channel/${createdChannelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
