import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schemas';
import { env } from '../env';

if (!env.POSTGRES_URL) {
  throw new Error('Missing POSTGRES_URL environment variable');
}

export const client = postgres(env.POSTGRES_URL);
export const db = drizzle(client, { schema, logger: false });
