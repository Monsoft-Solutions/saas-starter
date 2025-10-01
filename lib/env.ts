import { z } from 'zod';

/**
 * Centralised environment validation for server-only secrets.
 * Expands over time as additional integrations require typed config.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Base URL
  BASE_URL: z.string().url('BASE_URL must be a valid URL.'),

  // Resend
  RESEND_API_KEY: z.string().min(1, 'Resend API key is required.'),
  RESEND_FROM_EMAIL: z
    .string()
    .min(1, 'Resend from email is required.')
    .email('Invalid email address.'),
  RESEND_WEBHOOK_SECRET: z
    .string()
    .min(1, 'Resend webhook secret is required.'),

  // Database
  POSTGRES_URL: z.string().min(1, 'PostgreSQL URL is required.'),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(1, 'BetterAuth secret is required.'),
  BETTER_AUTH_URL: z.string().url('BetterAuth URL is required.'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required.'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'Stripe webhook secret is required.'),

  // Optional email metadata
  RESEND_REPLY_TO: z.string().email('Invalid email address.').optional(),
  APP_SUPPORT_EMAIL: z.string().email('Invalid email address.').optional(),

  // Cache Configuration
  CACHE_PROVIDER: z.enum(['in-memory', 'upstash']).default('in-memory'),
  CACHE_DEFAULT_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('3600'),

  // Upstash Redis (optional, required in production if using upstash)
  REDIS_REST_URL: z.string().url().optional(),
  REDIS_REST_TOKEN: z.string().optional(),

  // QStash (optional in development, required when background jobs enabled)
  QSTASH_URL: z.string().url().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  // Optional Social Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
});

const envValues = {
  NODE_ENV: process.env.NODE_ENV,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
  APP_SUPPORT_EMAIL: process.env.APP_SUPPORT_EMAIL,
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
  POSTGRES_URL: process.env.POSTGRES_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CACHE_PROVIDER: process.env.CACHE_PROVIDER,
  CACHE_DEFAULT_TTL: process.env.CACHE_DEFAULT_TTL || '3600',
  REDIS_REST_URL: process.env.REDIS_REST_URL,
  REDIS_REST_TOKEN: process.env.REDIS_REST_TOKEN,
  QSTASH_URL: process.env.QSTASH_URL,
  QSTASH_TOKEN: process.env.QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
};

export const env = envSchema.parse(envValues);

export type Env = z.infer<typeof envSchema>;
