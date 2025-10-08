/**
 * Admin user query functions.
 * Uses direct database access with caching and additional functionality.
 * Better Auth admin plugin manages the role and ban fields in the database.
 */
import { db } from '../drizzle';
import { user, member, organization, activityLogs } from '../schemas';
import { eq, ilike, or, desc, and, sql } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';
import { userTableDataSchema, type UserListFilters } from '@/lib/types/admin';

/**
 * List all users with filters and pagination.
 * Uses Better Auth's listUsers API as base, then applies additional filters.
 * Cached for performance.
 */
export async function listAllUsers(filters: UserListFilters) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  const cacheKey = CacheKeys.custom(
    'admin',
    `users-list-${JSON.stringify(filters)}`
  );

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;

      // Build query conditions
      const conditions = [];

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(ilike(user.email, searchPattern), ilike(user.name, searchPattern))
        );
      }

      if (filters.role) {
        conditions.push(eq(user.role, filters.role));
      }

      if (filters.banned !== undefined) {
        conditions.push(eq(user.banned, filters.banned));
      }

      if (filters.emailVerified !== undefined) {
        conditions.push(eq(user.emailVerified, filters.emailVerified));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get users with count
      const [users, [{ count: totalCount }]] = await Promise.all([
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            banned: user.banned,
            banReason: user.banReason,
            banExpires: user.banExpires,
          })
          .from(user)
          .where(whereClause)
          .orderBy(desc(user.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(whereClause),
      ]);

      const userOutput = users.map((user) => userTableDataSchema.parse(user));

      return {
        data: userOutput,
        total: Number(totalCount),
        limit,
        offset,
        hasMore: offset + users.length < Number(totalCount),
      };
    },
    { ttl: 60 } // Cache for 1 minute
  );
}

/**
 * Get user with full details (organizations, activity).
 * Cached for performance.
 */
export async function getUserWithDetails(userId: string) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', `user-details-${userId}`),
    async () => {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord) {
        return null;
      }

      // Get user's organizations
      const organizations = await db
        .select({
          organizationId: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: member.role,
          joinedAt: member.createdAt,
          stripeCustomerId: organization.stripeCustomerId,
          subscriptionStatus: organization.subscriptionStatus,
          planName: organization.planName,
        })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, userId))
        .orderBy(desc(member.createdAt));

      // Get recent activity
      const recentActivity = await db
        .select({
          id: activityLogs.id,
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          ipAddress: activityLogs.ipAddress,
        })
        .from(activityLogs)
        .where(eq(activityLogs.userId, userId))
        .orderBy(desc(activityLogs.timestamp))
        .limit(20);

      return {
        ...userRecord,
        organizations,
        recentActivity,
        organizationCount: organizations.length,
      };
    },
    { ttl: 120 } // Cache for 2 minutes
  );
}

/**
 * Update user role using direct database update.
 * Better Auth admin plugin manages the role field.
 * Invalidates user cache after update.
 */
export async function updateUserRole(
  userId: string,
  newRole: 'user' | 'admin' | 'super-admin'
) {
  try {
    // Direct database update for role (Better Auth syncs this)
    await db.update(user).set({ role: newRole }).where(eq(user.id, userId));

    logger.info('[admin-user] User role updated', { userId, newRole });

    // Invalidate cache
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(
      CacheKeys.custom('admin', `user-details-${userId}`)
    );

    // Invalidate user list cache (delete all user list variations)
    await cacheService.invalidatePattern('admin:users-list-*');
  } catch (error) {
    logger.error('[admin-user] Failed to update user role', {
      error,
      userId,
      newRole,
    });
    throw error;
  }
}

/**
 * Ban user using direct database update.
 * Better Auth admin plugin manages ban fields.
 * Invalidates user cache after ban.
 */
export async function banUserById(
  userId: string,
  reason: string,
  expiresInDays?: number
) {
  try {
    const banExpires = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await db
      .update(user)
      .set({
        banned: true,
        banReason: reason,
        banExpires,
      })
      .where(eq(user.id, userId));

    logger.info('[admin-user] User banned', { userId, reason, expiresInDays });

    // Invalidate cache
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(
      CacheKeys.custom('admin', `user-details-${userId}`)
    );

    // Invalidate user list cache
    await cacheService.invalidatePattern('admin:users-list-*');
  } catch (error) {
    logger.error('[admin-user] Failed to ban user', { error, userId });
    throw error;
  }
}

/**
 * Unban user using direct database update.
 * Better Auth admin plugin manages ban fields.
 * Invalidates user cache after unban.
 */
export async function unbanUserById(userId: string) {
  try {
    await db
      .update(user)
      .set({
        banned: false,
        banReason: null,
        banExpires: null,
      })
      .where(eq(user.id, userId));

    logger.info('[admin-user] User unbanned', { userId });

    // Invalidate cache
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(
      CacheKeys.custom('admin', `user-details-${userId}`)
    );

    // Invalidate user list cache
    await cacheService.invalidatePattern('admin:users-list-*');
  } catch (error) {
    logger.error('[admin-user] Failed to unban user', { error, userId });
    throw error;
  }
}

/**
 * Get user statistics.
 * Cached for performance.
 */
export async function getUserStatistics() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'user-statistics'),
    async () => {
      const [stats] = await db
        .select({
          totalUsers: sql<number>`count(*)::int`,
          verifiedUsers: sql<number>`count(*) FILTER (WHERE ${user.emailVerified} = true)::int`,
          bannedUsers: sql<number>`count(*) FILTER (WHERE ${user.banned} = true)::int`,
          adminUsers: sql<number>`count(*) FILTER (WHERE ${user.role} IN ('admin', 'super-admin'))::int`,
        })
        .from(user);

      return stats;
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Search users by email or name.
 * Optimized with ILIKE for PostgreSQL.
 */
export async function searchUsers(query: string, limit: number = 20) {
  const searchPattern = `%${query}%`;

  const results = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .where(
      or(ilike(user.email, searchPattern), ilike(user.name, searchPattern))
    )
    .limit(limit);

  return results;
}
