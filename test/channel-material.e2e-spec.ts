import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { cleanDatabase, prisma } from './setup-e2e';
import { Parent, Type, Genere, Catagory } from '@prisma/client';

describe('Channel-Material End-to-End Tests (Real Database)', () => {
  let app: INestApplication;
  let authToken: string;
  let sellerProfileId: number;
  let createdMaterialId: number;

  const testUser = {
    email: 'cm_e2e_user@example.com',
    password: 'SecurePassword123!',
    passwordConfirm: 'SecurePassword123!',
    username: 'cm_e2e_user',
    phoneNo: '+12345678905',
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

    // Register user
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
        name: 'Channel Material Seller',
        description: 'Seller bio',
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

  describe('POST /channel-material', () => {
    it('should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .post('/channel-material')
        .send({
          title: 'Unauthorized Content',
          sellerProfile_id: sellerProfileId,
        })
        .expect(401);
    });

    it('should create channel material in PostgreSQL with 201', async () => {
      const payload = {
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Psycology,
        catagory: Catagory.Fiction,
        title: 'Deep Channel Book',
        description: 'Exclusively on channel',
        author: 'Author Name',
        reader: 'Reader Name',
        translator: 'Translator Name',
        length_minute: 120,
        length_page: 300,
        language: 'English',
        publisher: 'Channel Media',
        episode: 1,
        continues_from: 0,
        first_published_at: new Date().toISOString(),
        sellerProfile_id: sellerProfileId,
      };

      const res = await request(app.getHttpServer())
        .post('/channel-material')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Deep Channel Book');
      createdMaterialId = res.body.id;

      // Verify in PostgreSQL
      const dbMaterial = await prisma.channelMaterial.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial).toBeDefined();
      expect(dbMaterial?.title).toBe('Deep Channel Book');
    });

    it('should reject non-existent seller profile with error', () => {
      const payload = {
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Psycology,
        catagory: Catagory.Fiction,
        title: 'Deep Channel Book 2',
        description: 'Exclusively on channel',
        author: 'Author Name',
        reader: 'Reader Name',
        translator: 'Translator Name',
        length_minute: 120,
        length_page: 300,
        language: 'English',
        publisher: 'Channel Media',
        episode: 2,
        continues_from: 1,
        first_published_at: new Date().toISOString(),
        sellerProfile_id: 999999,
      };

      return request(app.getHttpServer())
        .post('/channel-material')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('GET /channel-material', () => {
    it('should return list of all channel materials with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/channel-material')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((cm: any) => cm.id === createdMaterialId);
      expect(found).toBeDefined();
    });

    it('should return single channel material by ID with 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/channel-material/${createdMaterialId}`)
        .expect(200);

      expect(res.body.id).toBe(createdMaterialId);
      expect(res.body.title).toBe('Deep Channel Book');
    });

    it('should return message when material not found', async () => {
      const res = await request(app.getHttpServer())
        .get('/channel-material/999999')
        .expect(200);

      expect(res.body).toEqual({ message: 'Material Not Found' });
    });
  });

  describe('PATCH /channel-material/:id', () => {
    it('should update channel material in PostgreSQL with 200', async () => {
      const updatePayload = {
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Psycology,
        catagory: Catagory.Fiction,
        title: 'Updated Channel Book Title',
        description: 'Updated Description',
        author: 'Author Name',
        reader: 'Reader Name',
        translator: 'Translator Name',
        length_minute: 130,
        length_page: 310,
        language: 'English',
        publisher: 'Channel Media',
        episode: 1,
        continues_from: 0,
        first_published_at: new Date().toISOString(),
        sellerProfile_id: sellerProfileId,
      };

      const res = await request(app.getHttpServer())
        .patch(`/channel-material/${createdMaterialId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.title).toBe('Updated Channel Book Title');

      // Verify in PostgreSQL
      const dbMaterial = await prisma.channelMaterial.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial?.title).toBe('Updated Channel Book Title');
    });

    it('should return 404 when updating non-existent channel material', () => {
      const updatePayload = {
        parent: Parent.Publication,
        type: Type.Book,
        genere: Genere.Psycology,
        catagory: Catagory.Fiction,
        title: 'Non-existent',
        description: 'Updated Description',
        author: 'Author Name',
        reader: 'Reader Name',
        translator: 'Translator Name',
        length_minute: 130,
        length_page: 310,
        language: 'English',
        publisher: 'Channel Media',
        episode: 1,
        continues_from: 0,
        first_published_at: new Date().toISOString(),
        sellerProfile_id: sellerProfileId,
      };

      return request(app.getHttpServer())
        .patch('/channel-material/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload)
        .expect(404);
    });
  });

  describe('DELETE /channel-material/:id', () => {
    it('should delete channel material in PostgreSQL with 200', async () => {
      await request(app.getHttpServer())
        .delete(`/channel-material/${createdMaterialId}`)
        .expect(200);

      // Verify removed from PostgreSQL
      const dbMaterial = await prisma.channelMaterial.findUnique({
        where: { id: createdMaterialId },
      });
      expect(dbMaterial).toBeNull();
    });

    it('should return 404 when deleting already deleted channel material', () => {
      return request(app.getHttpServer())
        .delete(`/channel-material/${createdMaterialId}`)
        .expect(404);
    });
  });
});
