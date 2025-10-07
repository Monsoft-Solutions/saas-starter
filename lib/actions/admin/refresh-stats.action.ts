'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import { refreshAdminStatistics } from '@/lib/db/queries/admin-statistics.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import { ActivityType } from '@/lib/types/activity-log';
import logger from '@/lib/logger/logger.service';

/**
 * Server action to refresh admin statistics.
 * Requires the `analytics:write` admin permission.
 */
export const refreshStatsAction = withPermission(
  'analytics:write',
  async (_formData, context) => {
    try {
      // Refresh statistics (no input validation needed as this is a simple refresh operation)
      const stats = await refreshAdminStatistics();

      // Log admin action
      await logActivity({
        action: ActivityType.ADMIN_STATS_REFRESHED,
        metadata: {
          calculationDurationMs: stats.calculationDurationMs,
          totalUsers: stats.totalUsers,
          totalOrganizations: stats.totalOrganizations,
          totalMRR: stats.totalMRR,
        },
      });

      logger.info(
        '[refresh-stats-action] Admin statistics refreshed successfully',
        {
          userId: context.user.id,
          duration: stats.calculationDurationMs,
        }
      );

      return {
        success: 'Admin statistics refreshed successfully',
        stats: {
          totalUsers: stats.totalUsers,
          activeUsersLast30Days: stats.activeUsersLast30Days,
          newUsersLast30Days: stats.newUsersLast30Days,
          totalOrganizations: stats.totalOrganizations,
          organizationsWithSubscriptions: stats.organizationsWithSubscriptions,
          totalMRR: stats.totalMRR,
          totalActiveSubscriptions: stats.totalActiveSubscriptions,
          trialOrganizations: stats.trialOrganizations,
          calculationDurationMs: stats.calculationDurationMs,
        },
      };
    } catch (error) {
      logger.error(
        '[refresh-stats-action] Failed to refresh admin statistics',
        {
          error,
          userId: context.user.id,
        }
      );

      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh statistics',
      };
    }
  },
  'admin.analytics.refresh'
);
