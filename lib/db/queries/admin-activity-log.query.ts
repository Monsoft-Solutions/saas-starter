/**
 * Admin activity log query functions.
 * Provides access to all activity logs for the admin panel.
 */
import { db } from '../drizzle';
import { activityLogs, user } from '../schemas';
import { desc, eq, and, gte, lte, sql, ilike, or } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';

export type ActivityLogFilters = {
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search in user email or action
  limit?: number;
  offset?: number;
};

/**
 * List all activity logs with filters and pagination.
 * Joins with user table to include user details.
 */
export async function listAllActivityLogs(filters: ActivityLogFilters = {}) {
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  // Build query conditions
  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(activityLogs.userId, filters.userId));
  }

  if (filters.action) {
    conditions.push(eq(activityLogs.action, filters.action));
  }

  if (filters.startDate) {
    conditions.push(gte(activityLogs.timestamp, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(activityLogs.timestamp, filters.endDate));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(user.email, searchPattern),
        ilike(activityLogs.action, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get activity logs with user details
  const [logs, [{ count: totalCount }]] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userEmail: user.email,
        userName: user.name,
        userImage: user.image,
      })
      .from(activityLogs)
      .innerJoin(user, eq(activityLogs.userId, user.id))
      .where(whereClause)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityLogs)
      .innerJoin(user, eq(activityLogs.userId, user.id))
      .where(whereClause),
  ]);

  return {
    logs,
    total: Number(totalCount),
    limit,
    offset,
    hasMore: offset + logs.length < Number(totalCount),
  };
}

/**
 * Get activity statistics for admin dashboard.
 */
export async function getActivityStatistics(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [stats] = await db
    .select({
      totalActivities: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(DISTINCT ${activityLogs.userId})::int`,
      signIns: sql<number>`count(*) FILTER (WHERE ${activityLogs.action} = 'SIGN_IN')::int`,
      signUps: sql<number>`count(*) FILTER (WHERE ${activityLogs.action} = 'SIGN_UP')::int`,
      adminActions: sql<number>`count(*) FILTER (WHERE ${activityLogs.action} LIKE 'admin.%')::int`,
    })
    .from(activityLogs)
    .where(gte(activityLogs.timestamp, startDate));

  return stats;
}

/**
 * Get most active users by activity count.
 */
export async function getMostActiveUsers(limit: number = 10) {
  const results = await db
    .select({
      userId: activityLogs.userId,
      userEmail: user.email,
      userName: user.name,
      userImage: user.image,
      activityCount: sql<number>`count(*)::int`,
      lastActivity: sql<Date>`max(${activityLogs.timestamp})`,
    })
    .from(activityLogs)
    .innerJoin(user, eq(activityLogs.userId, user.id))
    .groupBy(activityLogs.userId, user.email, user.name, user.image)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

  return results;
}

/**
 * Get activity breakdown by action type.
 */
export async function getActivityBreakdown(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      action: activityLogs.action,
      count: sql<number>`count(*)::int`,
    })
    .from(activityLogs)
    .where(gte(activityLogs.timestamp, startDate))
    .groupBy(activityLogs.action)
    .orderBy(sql`count(*) DESC`)
    .limit(20);

  return results;
}

/**
 * Export activity logs to CSV format.
 * Returns CSV string with all activity log data.
 */
export async function exportActivityLogsToCSV(
  filters: ActivityLogFilters = {}
): Promise<string> {
  // Get all logs matching filters (with a higher limit for export)
  const exportLimit = Math.min(filters.limit ?? 10000, 10000);
  const result = await listAllActivityLogs({
    ...filters,
    limit: exportLimit,
    offset: 0,
  });

  // Create CSV header
  const headers = [
    'ID',
    'User Email',
    'User Name',
    'Action',
    'Timestamp',
    'IP Address',
  ];
  const csvLines = [headers.join(',')];

  // Add data rows
  for (const log of result.logs) {
    const row = [
      log.id,
      `"${log.userEmail}"`, // Escape email in quotes
      `"${log.userName ?? ''}"`, // Escape name in quotes
      `"${log.action}"`,
      log.timestamp.toISOString(),
      log.ipAddress ?? '',
    ];
    csvLines.push(row.join(','));
  }

  logger.info('[admin-activity-log] Activity logs exported to CSV', {
    totalLogs: result.logs.length,
    filters,
  });

  return csvLines.join('\n');
}
