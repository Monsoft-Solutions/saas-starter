'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  getAdminStatistics,
  getHistoricalStatistics,
  getUserGrowthData,
} from '@/lib/db/queries/admin-statistics.query';

/**
 * Server action to get latest cached admin statistics.
 * Requires the `analytics:read` admin permission.
 */
export const getAdminStatisticsAction = withPermission(
  'analytics:read',
  async () => {
    return await getAdminStatistics();
  },
  'admin.statistics.current'
);

/**
 * Server action to get historical statistics for trend analysis.
 * Requires the `analytics:read` admin permission.
 */
export const getHistoricalStatisticsAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    return await getHistoricalStatistics(days);
  },
  'admin.statistics.historical'
);

/**
 * Server action to get user growth data for the last 30 days.
 * Returns daily user registration counts for chart visualization.
 * Requires the `analytics:read` admin permission.
 */
export const getUserGrowthDataAction = withPermission(
  'analytics:read',
  async () => {
    return await getUserGrowthData();
  },
  'admin.statistics.user-growth'
);
