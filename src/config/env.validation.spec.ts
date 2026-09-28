import { envValidationSchema } from './env.validation';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

describe('Environment Configuration Validation (Joi)', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: 3007,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    JWT_SECRET: 'super-secret-jwt-key-minimum-16-chars',
    JWT_REFRESH_SECRET: 'super-secret-refresh-key-minimum-16-chars',
  };

  it('should validate successfully when all required env vars are provided', () => {
    const { error, value } = envValidationSchema.validate(validEnv);
    expect(error).toBeUndefined();
    expect(value.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(value.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    expect(value.JWT_REFRESH_SECRET).toBe(validEnv.JWT_REFRESH_SECRET);
    expect(value.PORT).toBe(3007);
    expect(value.THROTTLE_TTL).toBe(60000);
    expect(value.THROTTLE_LIMIT).toBe(100);
  });

  it('should fail fast when DATABASE_URL is missing', () => {
    const invalidEnv: Partial<typeof validEnv> = { ...validEnv };
    delete invalidEnv.DATABASE_URL;
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"DATABASE_URL" is required');
  });

  it('should fail fast when JWT_SECRET is missing', () => {
    const invalidEnv: Partial<typeof validEnv> = { ...validEnv };
    delete invalidEnv.JWT_SECRET;
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"JWT_SECRET" is required');
  });

  it('should fail fast when JWT_SECRET is shorter than 16 characters', () => {
    const invalidEnv = { ...validEnv, JWT_SECRET: 'too-short' };
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain(
      '"JWT_SECRET" length must be at least 16 characters long',
    );
  });

  it('should fail fast when JWT_REFRESH_SECRET is missing', () => {
    const invalidEnv: Partial<typeof validEnv> = { ...validEnv };
    delete invalidEnv.JWT_REFRESH_SECRET;
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain('"JWT_REFRESH_SECRET" is required');
  });

  it('should fail fast when JWT_REFRESH_SECRET is shorter than 16 characters', () => {
    const invalidEnv = { ...validEnv, JWT_REFRESH_SECRET: 'short' };
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain(
      '"JWT_REFRESH_SECRET" length must be at least 16 characters long',
    );
  });

  it('should reject invalid NODE_ENV values', () => {
    const invalidEnv = { ...validEnv, NODE_ENV: 'staging' };
    const { error } = envValidationSchema.validate(invalidEnv);
    expect(error).toBeDefined();
    expect(error?.message).toContain(
      '"NODE_ENV" must be one of [development, test, production]',
    );
  });

  it('should prevent module bootstrap when required configuration is missing', async () => {
    const originalEnv = { ...process.env };
    try {
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const moduleBuilder = Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            ignoreEnvFile: true,
            ignoreEnvVars: true,
            validationSchema: envValidationSchema,
          }),
        ],
      });

      await expect(moduleBuilder.compile()).rejects.toThrow();
    } finally {
      process.env = originalEnv;
    }
  });
});
