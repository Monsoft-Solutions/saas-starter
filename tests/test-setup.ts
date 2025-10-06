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

// Load .env.local first (if present), then fallback to default .env without overriding existing vars.
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

// Database test instance - only initialize if needed for integration tests
// Unit tests that don't need database should not use this
let dbTestInstance: ReturnType<typeof drizzle> | null = null;

export const getDbTest = () => {
  if (!dbTestInstance) {
    dbTestInstance = drizzle(new PGlite(), { schema });
  }
  return dbTestInstance;
};

// Export legacy dbTest for backwards compatibility
export const dbTest = getDbTest();

// Only run migrations if POSTGRES_URL is set (for integration tests)
// Unit tests don't need the database
beforeAll(async () => {
  if (process.env.POSTGRES_URL && dbTestInstance) {
    await migrate(dbTestInstance, { migrationsFolder: './lib/db/migrations' });
  }
});
