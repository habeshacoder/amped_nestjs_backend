import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';

describe('Profiles End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let createdProfileId: number;

  const testUser = {
    email: 'profile_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'profile_e2e_user',
    phoneNo: '+12345678910',
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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await cleanDatabase();
  });

  describe('POST /profiles', () => {
    it('should reject unauthenticated profile creation with 401', () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .field('first_name', 'John')
        .field('last_name', 'Doe')
        .field('sex', 'Male')
        .field('date_of_birth', '1990-01-01')
        .expect(401);
    });

    it('should reject creation with missing required fields with 400', () => {
      return request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('first_name', 'John')
        .expect(400);
    });

    it('should create a profile successfully with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('first_name', 'John')
        .field('last_name', 'Doe')
        .field('sex', 'Male')
        .field('date_of_birth', '1990-01-01')
        .expect(201);

      expect(res.body).toBeDefined();
      expect(res.body.first_name).toBe('John');
      expect(res.body.last_name).toBe('Doe');
      expect(res.body.user_id).toBe(userId);
      createdProfileId = res.body.id;

      // Verify in DB
      const dbProfile = await prisma.profile.findUnique({
        where: { id: createdProfileId },
      });
      expect(dbProfile).toBeDefined();
      expect(dbProfile?.first_name).toBe('John');
    });

    it('should reject creating duplicate profile for same user with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .field('first_name', 'Another')
        .field('last_name', 'Name')
        .field('sex', 'Male')
        .field('date_of_birth', '1995-05-05')
        .expect(409);

      expect(res.body.statusCode).toBe(409);
    });
  });

  describe('GET /profiles', () => {
    it('should return all profiles with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/profiles')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((p: any) => p.id === createdProfileId);
      expect(found).toBeDefined();
    });
  });

  describe('GET /profiles/me', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer()).get('/profiles/me').expect(401);
    });

    it('should return authenticated user profile with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdProfileId);
      expect(res.body.user_id).toBe(userId);
    });
  });

  describe('GET /profiles/:id', () => {
    it('should return profile by id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profiles/${createdProfileId}`)
        .expect(200);

      expect(res.body.id).toBe(createdProfileId);
      expect(res.body.first_name).toBe('John');
    });

    it('should return message when profile does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/profiles/999999')
        .expect(200);

      expect(res.body.message).toBe('No profile found.');
    });
  });

  describe('GET /profiles/user_profile/:user_id', () => {
    it('should return profile by user_id with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/profiles/user_profile/${userId}`)
        .expect(200);

      expect(res.body.id).toBe(createdProfileId);
      expect(res.body.user_id).toBe(userId);
    });
  });

  describe('PATCH /profiles/:id', () => {
    it('should reject unauthenticated update with 401', () => {
      return request(app.getHttpServer())
        .patch(`/profiles/${createdProfileId}`)
        .send({
          first_name: 'UpdatedJohn',
          last_name: 'UpdatedDoe',
          sex: 'Female',
          date_of_birth: '1992-02-02',
        })
        .expect(401);
    });

    it('should update profile with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/profiles/${createdProfileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'Johnny',
          last_name: 'DoeUpdated',
          sex: 'Male',
          date_of_birth: '1990-01-01',
        })
        .expect(200);

      expect(res.body.first_name).toBe('Johnny');
      expect(res.body.last_name).toBe('DoeUpdated');
    });

    it('should return 404 when updating non-existent profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profiles/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'NonExistent',
          last_name: 'Profile',
          sex: 'Female',
          date_of_birth: '1990-01-01',
        })
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });
  });

  describe('PATCH /profiles/update_password', () => {
    it('should reject unauthenticated password update with 401', () => {
      return request(app.getHttpServer())
        .patch('/profiles/update_password')
        .send({
          oldPassword: 'SecurePassword123!',
          newPassword: 'NewSecurePassword123!',
          newPasswordConfirm: 'NewSecurePassword123!',
        })
        .expect(401);
    });

    it('should reject password update with wrong old password with 403', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profiles/update_password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'WrongPassword1!',
          newPassword: 'NewPass123!',
          newPasswordConfirm: 'NewPass123!',
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should update password successfully with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profiles/update_password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: 'NewPass123!',
          newPasswordConfirm: 'NewPass123!',
        })
        .expect(200);

      expect(res.body.message).toBe('Password Updated Successfully');

      // Verify signin works with new password
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: 'NewPass123!',
        })
        .expect(200);
    });
  });

  describe('DELETE /profiles/:id', () => {
    it('should return 404 when deleting non-existent profile', async () => {
      const res = await request(app.getHttpServer())
        .delete('/profiles/999999')
        .expect(404);

      expect(res.body.statusCode).toBe(404);
    });

    it('should delete profile with 200', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/profiles/${createdProfileId}`)
        .expect(200);

      expect(res.body.message).toBe('Profile deleted successfully');

      // Verify deleted from DB
      const dbProfile = await prisma.profile.findUnique({
        where: { id: createdProfileId },
      });
      expect(dbProfile).toBeNull();
    });
  });
});
