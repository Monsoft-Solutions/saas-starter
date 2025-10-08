'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllActivityLogs,
  getActivityStatistics,
  getMostActiveUsers,
  getActivityBreakdown,
  getActivityLogById,
  exportActivityLogsToCSV,
} from '@/lib/db/queries/admin-activity-log.query';
import {
  activityLogFiltersSchema,
  activityStatisticsParamsSchema,
  mostActiveUsersParamsSchema,
  activityBreakdownParamsSchema,
  activityLogIdSchema,
  ActivityLogFilters,
} from '@/lib/types/admin/admin-activity-action-input.schema';

/**
 * Server action to list all activity logs with filters and pagination.
 * Requires the `analytics:read` admin permission.
 * Validates input to ensure proper types and bounds checking.
 */
export const listAllActivityLogsAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters) => {
    const validated = activityLogFiltersSchema.parse(filters);
    return await listAllActivityLogs(validated);
  },
  'admin.activity-logs.list'
);

/**
 * Server action to get activity statistics for admin dashboard.
 * Requires the `analytics:read` admin permission.
 * Validates days parameter to ensure it's within acceptable range (1-365).
 */
export const getActivityStatisticsAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    const { days: validatedDays } = activityStatisticsParamsSchema.parse({
      days,
    });
    return await getActivityStatistics(validatedDays);
  },
  'admin.activity-logs.statistics'
);

/**
 * Server action to get most active users by activity count.
 * Requires the `analytics:read` admin permission.
 * Validates limit parameter to ensure it's within acceptable range (1-100).
 */
export const getMostActiveUsersAction = withPermission(
  'analytics:read',
  async (limit: number = 10) => {
    const { limit: validatedLimit } = mostActiveUsersParamsSchema.parse({
      limit,
    });
    return await getMostActiveUsers(validatedLimit);
  },
  'admin.activity-logs.most-active-users'
);

/**
 * Server action to get activity breakdown by action type.
 * Requires the `analytics:read` admin permission.
 * Validates days parameter to ensure it's within acceptable range (1-365).
 */
export const getActivityBreakdownAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    const { days: validatedDays } = activityBreakdownParamsSchema.parse({
      days,
    });
    return await getActivityBreakdown(validatedDays);
  },
  'admin.activity-logs.breakdown'
);

/**
 * Server action to get a single activity log by ID with full user details.
 * Requires the `analytics:read` admin permission.
 * Validates ID to ensure it's a positive integer.
 */
export const getActivityLogByIdAction = withPermission(
  'analytics:read',
  async (id: number) => {
    const { id: validatedId } = activityLogIdSchema.parse({ id });
    return await getActivityLogById(validatedId);
  },
  'admin.activity-logs.details'
);

/**
 * Server action to export activity logs to CSV format.
 * Requires the `analytics:read` admin permission.
 * Validates input to ensure proper types and bounds checking.
 */
export const exportActivityLogsToCSVAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters) => {
    const validated = activityLogFiltersSchema.parse(filters);
    return await exportActivityLogsToCSV(validated);
  },
  'admin.activity-logs.export'
);
