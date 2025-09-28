import { z } from 'zod';

/**
 * Centralised environment validation for server-only secrets.
 * Expands over time as additional integrations require typed config.
 */
const envSchema = z.object({
  // Base URL
  BASE_URL: z.string().url('BASE_URL must be a valid URL.'),

  // Auth
  BETTER_AUTH_URL: z.string().url('BetterAuth URL is required.'),
});

const envValues = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,

  BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
};

export const envClient = envSchema.parse(envValues);

export type EnvClient = z.infer<typeof envSchema>;
