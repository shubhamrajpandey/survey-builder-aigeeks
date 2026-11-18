import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend directory as well as current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/survey_app'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('super_secret_jwt_key_at_least_32_characters_long_ai_geeks'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ORIGIN: z.string().default('*'),
  IP_SALT: z.string().min(16, 'IP_SALT must be at least 16 characters long').default('secure_salt_for_ip_hash_at_least_16_chars'),
  SPAM_PROTECTION_ENABLED: z
    .string()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
  SPAM_WINDOW_SECONDS: z.string().default('60').transform((val) => parseInt(val, 10)),
  ADMIN_EMAIL: z.string().email().default('admin@aigeeks.io'),
  ADMIN_PASSWORD: z.string().min(8).default('AdminPassword123!'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
