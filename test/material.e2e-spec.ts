import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';
import { Parent, Type, Genere, Catagory } from '@prisma/client';

describe('Material End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let sellerProfileId: number;
  let createdMaterialId: number;

  const testUser = {
    email: 'material_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'material_e2e_user',
    phoneNo: '+12345678903',
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

    // Register user to get JWT token
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser);
    authToken = signupRes.body.accessToken;

    const dbUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    // Create seller profile
    const seller = await prisma.sellerProfile.create({
      data: {
        user_id: dbUser!.id,
        name: 'Material Publisher',
        description: 'Quality Materials Publisher',
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

  describe('POST /material', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/material')
        .send({
          parent: Parent.Publication,
          type: Type.Book,
          genere: Genere.Unspecified,
          catagory: Catagory.Fiction,
          title: 'Unauthorized Material',
          sellerProfile_id: sellerProfileId,
        })
        .expect(401);
    });

    it('should reject invalid payload with 400', () => {
      return request(app.getHttpServer())
        .post('/material')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Missing Required Enums',
        })
        .expect(400);
    });

    it('should create a material in PostgreSQL with 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/material')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parent: Parent.Publication,
          type: Type.Book,
          genere: Genere.Unspecified,
          catagory: Catagory.Fiction,
          title: 'Thinking Deeply',
          description: 'A study on cognitive processes',
          price: 29.99,
          sellerProfile_id: sellerProfileId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Thinking Deeply');
      expect(res.body.price).toBe(29.99);
      createdMaterialId = res.body.id;

      // Verify in PostgreSQL
      const dbMaterial = await prisma.material.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial).toBeDefined();
      expect(dbMaterial?.title).toBe('Thinking Deeply');
    });

    it('should reject material creation with non-existent seller profile FK', () => {
      return request(app.getHttpServer())
        .post('/material')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parent: Parent.Publication,
          type: Type.Book,
          genere: Genere.Unspecified,
          catagory: Catagory.Fiction,
          title: 'Ghost Seller Material',
          sellerProfile_id: 999999,
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('GET /material', () => {
    it('should return all materials with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/material')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((m: any) => m.id === createdMaterialId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Thinking Deeply');
    });

    it('should return single material by ID with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/material/${createdMaterialId}`)
        .expect(200);

      expect(res.body.id).toBe(createdMaterialId);
      expect(res.body.title).toBe('Thinking Deeply');
    });

    it('should return 400 for non-numeric material ID via ParseIntPipe', () => {
      return request(app.getHttpServer())
        .get('/material/invalid-id')
        .expect(400);
    });

    it('should return message when material ID is not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/material/999999')
        .expect(200);

      expect(res.body).toEqual({ message: 'Material Not Found' });
    });
  });

  describe('PATCH /material/:id', () => {
    it('should update material in PostgreSQL with 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/material/${createdMaterialId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parent: Parent.Publication,
          type: Type.Book,
          genere: Genere.Unspecified,
          catagory: Catagory.Fiction,
          title: 'Thinking Deeply (2nd Edition)',
          price: 34.99,
          sellerProfile_id: sellerProfileId,
        })
        .expect(200);

      expect(res.body.title).toBe('Thinking Deeply (2nd Edition)');

      // Verify in PostgreSQL
      const dbMaterial = await prisma.material.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial?.title).toBe('Thinking Deeply (2nd Edition)');
    });

    it('should return 404 when updating non-existent material', () => {
      return request(app.getHttpServer())
        .patch('/material/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parent: Parent.Publication,
          type: Type.Book,
          genere: Genere.Unspecified,
          catagory: Catagory.Fiction,
          title: 'Non-existent',
          sellerProfile_id: sellerProfileId,
        })
        .expect(404);
    });
  });

  describe('DELETE /material/:id', () => {
    it('should delete material in PostgreSQL with 200', async () => {
      await request(app.getHttpServer())
        .delete(`/material/${createdMaterialId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify removed from PostgreSQL
      const dbMaterial = await prisma.material.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial).toBeNull();
    });

    it('should return 404 when deleting already deleted material', () => {
      return request(app.getHttpServer())
        .delete(`/material/${createdMaterialId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
