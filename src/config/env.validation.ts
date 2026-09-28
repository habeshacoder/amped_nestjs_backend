import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3007),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  CHAPA_SECRET_KEY: Joi.string().allow('').optional().default(''),
  CHAPA_WEBHOOK_HASH_KEY: Joi.string().allow('').optional().default(''),
  CHAPA_WEBHOOK_URL: Joi.string().allow('').optional().default(''),
  SHADOW_DATABASE_URL: Joi.string().allow('').optional().default(''),
  SENTRY_DSN: Joi.string().allow('').optional().default(''),
  CORS_ORIGIN: Joi.string().allow('').optional().default('*'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
