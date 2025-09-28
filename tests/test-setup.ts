import 'dotenv/config';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, vi } from 'vitest';
import * as schema from '@/lib/db/schemas';

vi.mock('@/lib/db/queries', () => ({
  // Mock the queries that use the User schema
  // This is necessary because the User schema is not directly imported here
  // and the tests might try to use it.
  // The actual implementation of these queries would be in @/lib/db/queries
}));

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

export const dbTest = drizzle(new PGlite(), { schema });

beforeAll(async () => {
  await migrate(dbTest, { migrationsFolder: './lib/db/migrations' });
});
