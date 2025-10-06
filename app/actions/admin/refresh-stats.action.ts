'use server';

import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { refreshAdminStatistics } from '@/lib/db/queries/admin-statistics.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import logger from '@/lib/logger/logger.service';

/**
 * Server action to refresh admin statistics.
 * Only accessible by super-admins.
 */
export const refreshStatsAction = withSuperAdmin(
  async (_formData, context) => {
    try {
      // Refresh statistics (no input validation needed as this is a simple refresh operation)
      const stats = await refreshAdminStatistics();

      // Log admin action
      await logActivity({
        userId: context.user.id,
        action: 'admin.stats.refreshed',
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
  {
    logAction: 'admin.stats.refreshed',
  }
);
