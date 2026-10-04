import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  SESSION_TTL_DAYS: Joi.number().default(7),
  SESSION_COOKIE_NAME: Joi.string().default('session'),
  COOKIE_SECURE: Joi.boolean().default(false),

  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  S3_ENDPOINT: Joi.string().default('http://localhost:9000'),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_ACCESS_KEY: Joi.string().allow('').default('infinipaper'),
  S3_SECRET_KEY: Joi.string().allow('').default('infinipaper'),
  S3_BUCKET: Joi.string().default('infinipaper'),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(true),

  MAX_UPLOAD_SIZE_MB: Joi.number().default(50),

  ASR_URL: Joi.string().default('http://localhost:8000'),
  ASR_API_KEY: Joi.string().allow('').default(''),
  ASR_DEFAULT_LANGUAGE: Joi.string().default('es'),
  ASR_MAX_DURATION_MINUTES: Joi.number().default(120),

  AVISO_FILENAME: Joi.string().default('aviso.md'),
});
