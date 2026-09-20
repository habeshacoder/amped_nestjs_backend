process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/amped_test?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'supersecrettestjwtkey1234567890';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'supersecrettestjwtrefreshkey1234567890';
process.env.NODE_ENV = 'test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('App End-to-End Tests', () => {
  let app: INestApplication;
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordReset: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([]),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health should return 200 with status ok and database up', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.info.database.status).toBe('up');
      });
  });

  it('GET /users/me should reject unauthenticated requests with 401', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body.statusCode).toBe(401);
        expect(res.body.path).toBe('/users/me');
      });
  });

  it('POST /auth/signin should reject empty body with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/signin')
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
        expect(res.body.path).toBe('/auth/signin');
      });
  });

  it('POST /auth/signin should reject invalid email format with 400', () => {
    return request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'not-an-email', password: 'password123' })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('GET /unknown-endpoint should return 404 with standardized error response', () => {
    return request(app.getHttpServer())
      .get('/unknown-endpoint')
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
        expect(res.body.path).toBe('/unknown-endpoint');
        expect(res.body.timestamp).toBeDefined();
        expect(res.body.requestId).toBeDefined();
      });
  });
});
