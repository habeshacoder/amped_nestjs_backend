import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';
import { Genere, Parent, Type, Catagory, ReportType } from '@prisma/client';

describe('Search End-to-End Tests (Real Database)', () => {
  let app: INestApplication;

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

    // Seed test entities for search tests
    const user = await prisma.user.create({
      data: {
        email: 'search_test_user@example.com',
        username: 'searchable_user',
        password: 'hashed_password',
      },
    });

    await prisma.profile.create({
      data: {
        user_id: user.id,
        first_name: 'SearchableFirstName',
        last_name: 'Doe',
        date_of_birth: '1990-01-01',
      },
    });

    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: user.id,
        name: 'Searchable Seller Profile',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Searchable Channel Name',
        description: 'Channel Bio',
        sellerProfile_id: seller.id,
      },
    });

    await prisma.material.create({
      data: {
        title: 'Searchable Material Title',
        description: 'Material Bio',
        sellerProfile_id: seller.id,
        price: 15.0,
        material: 'material.epub',
        genere: Genere.Unspecified,
        parent: Parent.Unspecified,
        type: Type.Unspecified,
        catagory: Catagory.Unspecified,
      },
    });

    await prisma.channelMaterial.create({
      data: {
        title: 'Searchable Channel Material Title',
        description: 'Desc',
        sellerProfile_id: seller.id,
        material: 'null',
        genere: Genere.Unspecified,
        parent: Parent.Unspecified,
        type: Type.Unspecified,
        catagory: Catagory.Unspecified,
      },
    });

    await prisma.subscriptionPlan.create({
      data: {
        name: 'Searchable Plan Gold',
        description: 'Plan description',
        price: 30,
        channel_id: channel.id,
      },
    });

    const rate = await prisma.rate.create({
      data: {
        user_id: user.id,
        channel_id: channel.id,
        rating: 5,
        remark: 'Searchable Remark Remarkable',
      },
    });

    await prisma.replay.create({
      data: {
        remark_id: rate.id,
        replay: 'Searchable Replay Response',
      },
    });

    await prisma.report.create({
      data: {
        user_id: user.id,
        channel_id: channel.id,
        report_type: ReportType.GenderViolation,
        report_desc: 'Searchable Report Description Violation',
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('GET /search/vercel', () => {
    it('should return connection confirmation with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/search/vercel')
        .expect(200);

      expect(res.text).toBe('congra! connected to vercel');
    });
  });

  describe('POST /search', () => {
    it('should search materials matching key with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search')
        .send({ key: 'Searchable Material' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].title).toContain('Searchable Material');
    });

    it('should return empty matches when no material matches', async () => {
      const res = await request(app.getHttpServer())
        .post('/search')
        .send({ key: 'NonExistentKey123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.mainMatches).toEqual([]);
    });
  });

  describe('POST /search/channel', () => {
    it('should search channels matching key with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/channel')
        .send({ key: 'Searchable Channel' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].name).toContain('Searchable Channel');
    });
  });

  describe('POST /search/user', () => {
    it('should search users matching username with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/user')
        .send({ key: 'searchable_user' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].username).toBe('searchable_user');
    });
  });

  describe('POST /search/sellerProfile', () => {
    it('should search seller profiles matching name with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/sellerProfile')
        .send({ key: 'Searchable Seller' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].name).toContain('Searchable Seller');
    });
  });

  describe('POST /search/profile', () => {
    it('should search profiles matching first_name with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/profile')
        .send({ key: 'SearchableFirstName' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].first_name).toContain(
        'SearchableFirstName',
      );
    });
  });

  describe('POST /search/channel-material', () => {
    it('should search channel materials matching title with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/channel-material')
        .send({ key: 'Searchable Channel Material' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].title).toContain(
        'Searchable Channel Material',
      );
    });
  });

  describe('POST /search/subscription-plan', () => {
    it('should search subscription plans matching name with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/subscription-plan')
        .send({ key: 'Searchable Plan' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].name).toContain('Searchable Plan');
    });
  });

  describe('POST /search/replays', () => {
    it('should search replays matching replay text with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/replays')
        .send({ key: 'Searchable Replay' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].replay).toContain('Searchable Replay');
    });
  });

  describe('POST /search/rate', () => {
    it('should search rates matching remark with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/rate')
        .send({ key: 'Searchable Remark' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].remark).toContain('Searchable Remark');
    });
  });

  describe('POST /search/reports', () => {
    it('should search reports matching report_desc with 200', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/reports')
        .send({ key: 'Searchable Report Description' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.mainMatches)).toBe(true);
      expect(res.body.mainMatches.length).toBeGreaterThanOrEqual(1);
      expect(res.body.mainMatches[0].report_desc).toContain(
        'Searchable Report Description',
      );
    });
  });
});
