import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, mockChapaService, prisma } from './setup-e2e';
import { ChapaService } from 'chapa-nestjs';

describe('App End-to-End Tests (Real Database)', () => {
  let app: INestApplication;

  const testUser = {
    email: 'e2e_app_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'e2e_app_user',
    phoneNo: '+12345678901',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    await cleanDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ChapaService)
      .useValue(mockChapaService)
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
    await cleanDatabase();
  });

  describe('System & Health Checks', () => {
    it('GET /health should return 200 with database status up', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.info.database.status).toBe('up');
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

  describe('Authentication Lifecycle', () => {
    it('POST /auth/signup should reject invalid input with 400', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ email: 'invalid-email', password: '123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    it('POST /auth/signup should register a new user in PostgreSQL and return JWT tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;

      // Verify record exists in real PostgreSQL
      const dbUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.username).toBe(testUser.username);
    });

    it('POST /auth/signup should reject duplicate email with 403 Forbidden', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(403);
    });

    it('POST /auth/signin should reject empty body with 400', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({})
        .expect(400);
    });

    it('POST /auth/signin should reject wrong password with 403', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: testUser.email, password: 'WrongPassword999!' })
        .expect(403);
    });

    it('POST /auth/signin should reject non-existent user with 403', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(403);
    });

    it('POST /auth/signin should authenticate valid credentials and issue tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('GET /auth/refresh should issue new tokens with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('GET /auth/refresh should reject invalid refresh token with 401', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('GET /auth/logout should invalidate session and return sanitized user', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
      expect(res.body.password).toBeUndefined();
      expect(res.body.refresh_token).toBeUndefined();

      // Verify the old refresh token can no longer be used
      await request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(403);
    });
  });

  describe('User Endpoints', () => {
    let activeToken: string;

    beforeAll(async () => {
      // Sign back in to get active token after logout
      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: testUser.email, password: testUser.password });
      activeToken = res.body.accessToken;
    });

    it('GET /users/me should reject unauthenticated requests with 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401)
        .expect((res) => {
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('GET /users/me should return authenticated user without password', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${activeToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.password).toBeUndefined();
      expect(res.body.refresh_token).toBeUndefined();
    });

    it('GET /users/all should return list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/all')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((u: any) => u.email === testUser.email);
      expect(found).toBeDefined();
      expect(found.password).toBeUndefined();
    });
  });
});
