import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { user } from '../schemas';
import { getServerContext } from '@/lib/auth/server-context';
import type { ServerUser } from '@/lib/auth/server-context';

export async function getUser(): Promise<ServerUser | null> {
  const context = await getServerContext();
  return context?.user ?? null;
}

export async function getUserById(userId: string) {
  const result = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
