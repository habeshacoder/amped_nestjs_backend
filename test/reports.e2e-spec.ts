import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';
import { Genere, Parent, Type, Catagory, ReportType } from '@prisma/client';

describe('Reports End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let channelId: number;
  let materialId: number;
  let createdReportId: number;

  const testUser = {
    email: 'reports_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'reports_e2e_user',
    phoneNo: '+12345678915',
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

    // Create seller, channel and material
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: userId,
        name: 'Report Test Seller',
        description: 'Seller Bio',
      },
    });

    const channel = await prisma.channel.create({
      data: {
        name: 'Report Test Channel',
        description: 'Channel Bio',
        sellerProfile_id: seller.id,
      },
    });
    channelId = channel.id;

    const material = await prisma.material.create({
      data: {
        title: 'Report Test Material',
        description: 'Material Bio',
        sellerProfile_id: seller.id,
        price: 9.99,
        material: 'material.epub',
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

  describe('POST /reports', () => {
    it('should reject unauthenticated report with 401', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .send({
          report_type: 'GenderViolation',
          report_desc: 'Offensive content detected',
          channel_id: channelId,
        })
        .expect(401);
    });

    it('should reject report with invalid enum with 400', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          report_type: 'InvalidType',
          report_desc: 'Offensive content detected',
          channel_id: channelId,
        })
        .expect(400);
    });

    it('should reject report without target channel or material with 403', () => {
      return request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          report_type: 'GenderViolation',
          report_desc: 'No target provided',
        })
        .expect(403);
    });

    it('should create report on channel successfully with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          report_type: 'GenderViolation',
          report_desc: 'Inappropriate language in channel description',
          channel_id: channelId,
        })
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.user_id).toBe(userId);
      expect(res.body.channel_id).toBe(channelId);
      expect(res.body.report_type).toBe('GenderViolation');
      createdReportId = res.body.id;

      // Verify in DB
      const dbReport = await prisma.report.findUnique({
        where: { id: createdReportId },
      });
      expect(dbReport).toBeDefined();
      expect(dbReport?.report_type).toBe(ReportType.GenderViolation);
    });

    it('should reject duplicate report on same channel by same user with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          report_type: 'Stereotype',
          report_desc: 'Duplicate report on same channel',
          channel_id: channelId,
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });

  describe('GET /reports', () => {
    it('should return all reports with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((r: any) => r.id === createdReportId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /reports/:id', () => {
    it('should return report by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/${createdReportId}`)
        .expect(200);

      expect(res.body.id).toBe(createdReportId);
      expect(res.body.report_type).toBe('GenderViolation');
    });

    it('should return message when report not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/999999')
        .expect(200);

      expect(res.body.message).toBe('No report found.');
    });
  });

  describe('GET /reports/report/:report_type', () => {
    it('should return reports matching report_type with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/report/GenderViolation')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].report_type).toBe('GenderViolation');
    });
  });

  describe('GET /reports/reports_on_channel/:channel_id', () => {
    it('should return reports on specified channel with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/reports_on_channel/${channelId}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].channel_id).toBe(channelId);
    });
  });

  describe('GET /reports/reports_on_material/:material_id', () => {
    it('should return reports on specified material or not found message with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/reports_on_material/${materialId}`)
        .expect(200);

      if (Array.isArray(res.body)) {
        expect(res.body.length).toBeGreaterThanOrEqual(0);
      } else {
        expect(res.body.message).toBe('No report found on material.');
      }
    });
  });

  describe('DELETE /reports/:id', () => {
    it('should return 403 when deleting non-existent report', async () => {
      const res = await request(app.getHttpServer())
        .delete('/reports/999999')
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should delete report successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/reports/${createdReportId}`)
        .expect(200);

      expect(res.body.message).toBe('Report deleted successfully');

      // Verify removed from DB
      const dbReport = await prisma.report.findUnique({
        where: { id: createdReportId },
      });
      expect(dbReport).toBeNull();
    });
  });
});
