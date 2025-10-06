/**
 * Admin statistics query functions.
 * Provides cached metrics for the admin dashboard.
 */
import { db } from '../drizzle';
import { adminStatistics, user, organization, activityLogs } from '../schemas';
import { sql, gte, count, desc, and, isNotNull, lte } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';

/**
 * Get latest cached admin statistics.
 * Uses cache to avoid repeated database queries.
 */
export async function getAdminStatistics() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'latest-statistics'),
    async () => {
      const result = await db
        .select()
        .from(adminStatistics)
        .orderBy(desc(adminStatistics.calculatedAt))
        .limit(1);

      return result[0] ?? null;
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Calculate fresh admin statistics from the database.
 * This performs complex aggregations and should be cached.
 */
export async function calculateAdminStatistics() {
  const startTime = Date.now();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // User metrics
    const [totalUsersResult] = await db.select({ count: count() }).from(user);

    // Active users (users with activity in last 30 days)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${activityLogs.userId})` })
      .from(activityLogs)
      .where(gte(activityLogs.timestamp, thirtyDaysAgo));

    // New users (created in last 30 days)
    const [newUsersResult] = await db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo));

    // Organization metrics
    const [totalOrgsResult] = await db
      .select({ count: count() })
      .from(organization);

    // Organizations with active subscriptions
    const [orgsWithSubsResult] = await db
      .select({ count: count() })
      .from(organization)
      .where(
        and(
          isNotNull(organization.stripeSubscriptionId),
          sql`${organization.subscriptionStatus} = 'active'`
        )
      );

    // Revenue metrics - calculate MRR based on plan names
    const subscriptionRevenue = await db
      .select({
        total: count(),
        mrr: sql<number>`
          COALESCE(SUM(CASE
            WHEN ${organization.planName} = 'Basic' THEN 10
            WHEN ${organization.planName} = 'Pro' THEN 25
            WHEN ${organization.planName} = 'Enterprise' THEN 100
            ELSE 0
          END), 0)
        `,
      })
      .from(organization)
      .where(sql`${organization.subscriptionStatus} = 'active'`);

    // Trial organizations (organizations without stripe subscription ID but exist)
    const [trialOrgsResult] = await db
      .select({ count: count() })
      .from(organization)
      .where(sql`${organization.stripeSubscriptionId} IS NULL`);

    // Calculate growth rates (comparing to previous period)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [usersPrevPeriod] = await db
      .select({ count: count() })
      .from(user)
      .where(
        and(
          gte(user.createdAt, sixtyDaysAgo),
          lte(user.createdAt, thirtyDaysAgo)
        )
      );

    const userGrowthRate =
      usersPrevPeriod.count > 0
        ? ((newUsersResult.count - usersPrevPeriod.count) /
            usersPrevPeriod.count) *
          100
        : 0;

    const calculationDuration = Date.now() - startTime;

    return {
      totalUsers: totalUsersResult.count,
      activeUsersLast30Days: Number(activeUsersResult.count) || 0,
      newUsersLast30Days: newUsersResult.count,
      totalOrganizations: totalOrgsResult.count,
      organizationsWithSubscriptions: orgsWithSubsResult.count,
      totalMRR: Number(subscriptionRevenue[0]?.mrr) || 0,
      totalActiveSubscriptions: subscriptionRevenue[0]?.total || 0,
      trialOrganizations: trialOrgsResult.count,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100, // Round to 2 decimals
      revenueGrowthRate: null, // Will be calculated when we have historical data
      churnRate: null, // Will be calculated when we have historical data
      calculationDurationMs: calculationDuration,
      calculatedAt: new Date(),
    };
  } catch (error) {
    logger.error('[admin-stats] Failed to calculate statistics', { error });
    throw error;
  }
}

/**
 * Calculate and store fresh admin statistics in the database.
 * Invalidates cache after insertion.
 */
export async function refreshAdminStatistics() {
  try {
    const stats = await calculateAdminStatistics();

    // Insert new statistics
    const [newStats] = await db
      .insert(adminStatistics)
      .values(stats)
      .returning();

    logger.info('[admin-stats] Statistics refreshed', {
      duration: stats.calculationDurationMs,
      totalUsers: stats.totalUsers,
      totalOrganizations: stats.totalOrganizations,
      totalMRR: stats.totalMRR,
    });

    // Invalidate cache so next fetch gets fresh data
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(CacheKeys.custom('admin', 'latest-statistics'));

    return newStats;
  } catch (error) {
    logger.error('[admin-stats] Failed to refresh statistics', { error });
    throw error;
  }
}

/**
 * Get historical statistics for trend analysis.
 * Cached for performance.
 */
export async function getHistoricalStatistics(days: number = 30) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', `historical-statistics-${days}`),
    async () => {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const results = await db
        .select()
        .from(adminStatistics)
        .where(gte(adminStatistics.calculatedAt, cutoffDate))
        .orderBy(desc(adminStatistics.calculatedAt))
        .limit(100);

      return results;
    },
    { ttl: 600 } // Cache for 10 minutes
  );
}
