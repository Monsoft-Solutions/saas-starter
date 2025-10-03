import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { user } from '../schemas';
import { getServerContext } from '@/lib/auth/server-context';
import type { ServerUser } from '@/lib/auth/server-context';
import { cacheService, CacheKeys } from '@/lib/cache';

export async function getUser(): Promise<ServerUser | null> {
  const context = await getServerContext();
  return context?.user ?? null;
}

export async function getUserById(userId: string) {
  return cacheService.getOrSet(
    CacheKeys.user(userId),
    async () => {
      const result = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    },
    { ttl: 900 } // Cache for 15 minutes
  );
}

/**
 * Invalidate user cache
 * Call this when user data is updated
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheService.invalidatePattern(CacheKeys.userPattern(userId));
}
