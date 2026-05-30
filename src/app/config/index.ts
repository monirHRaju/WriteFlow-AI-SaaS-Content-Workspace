import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load configuration from root .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Define environment validation schema
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }),
  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required',
  }).url('REDIS_URL must be a valid Redis URL'),
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required',
  }),
  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required',
  }),
  CORS_ORIGIN: z.string({
    required_error: 'CORS_ORIGIN is required',
  }),
  OPENAI_API_KEY: z.string().default('change_me_openai_api_key'),
});

// Run safety parse
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

const config = {
  port: parsedEnv.data.PORT,
  env: parsedEnv.data.NODE_ENV,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  redisUrl: parsedEnv.data.REDIS_URL,
  corsOrigin: parsedEnv.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  jwt: {
    secret: parsedEnv.data.JWT_SECRET,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  },
  openaiApiKey: parsedEnv.data.OPENAI_API_KEY,
};

export default config;
