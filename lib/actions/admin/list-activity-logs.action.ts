'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllActivityLogs,
  getActivityStatistics,
  getMostActiveUsers,
  getActivityBreakdown,
  getActivityLogById,
  exportActivityLogsToCSV,
  type ActivityLogFilters,
} from '@/lib/db/queries/admin-activity-log.query';

/**
 * Server action to list all activity logs with filters and pagination.
 * Requires the `analytics:read` admin permission.
 */
export const listAllActivityLogsAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters) => {
    return await listAllActivityLogs(filters);
  },
  'admin.activity-logs.list'
);

/**
 * Server action to get activity statistics for admin dashboard.
 * Requires the `analytics:read` admin permission.
 */
export const getActivityStatisticsAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    return await getActivityStatistics(days);
  },
  'admin.activity-logs.statistics'
);

/**
 * Server action to get most active users by activity count.
 * Requires the `analytics:read` admin permission.
 */
export const getMostActiveUsersAction = withPermission(
  'analytics:read',
  async (limit: number = 10) => {
    return await getMostActiveUsers(limit);
  },
  'admin.activity-logs.most-active-users'
);

/**
 * Server action to get activity breakdown by action type.
 * Requires the `analytics:read` admin permission.
 */
export const getActivityBreakdownAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    return await getActivityBreakdown(days);
  },
  'admin.activity-logs.breakdown'
);

/**
 * Server action to get a single activity log by ID with full user details.
 * Requires the `analytics:read` admin permission.
 */
export const getActivityLogByIdAction = withPermission(
  'analytics:read',
  async (id: number) => {
    return await getActivityLogById(id);
  },
  'admin.activity-logs.details'
);

/**
 * Server action to export activity logs to CSV format.
 * Requires the `analytics:read` admin permission.
 */
export const exportActivityLogsToCSVAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters) => {
    return await exportActivityLogsToCSV(filters);
  },
  'admin.activity-logs.export'
);
