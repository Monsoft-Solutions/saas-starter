import { defineConfig } from 'drizzle-kit';
import { env } from './lib/env';

export default defineConfig({
  schema: './lib/db/schemas/index.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
});
