import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import {
  getAdminStatistics,
  refreshAdminStatistics,
} from '@/lib/db/queries/admin-statistics.query';
import { SuperAdminRequiredError } from '@/lib/auth/super-admin-context';
import { adminStatsRequestSchema } from '@/lib/types/admin/admin-stats-request.schema';
import { adminStatsResponseSchema } from '@/lib/types/admin/admin-stats-response.schema';
import { error } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/stats
 *
 * Retrieve cached admin statistics for dashboard.
 * Supports optional force refresh via ?refresh=true query parameter.
 *
 * Query parameters:
 * - refresh: Force refresh of cached statistics (true/false) (optional)
 *
 * Uses validated admin handler with:
 * - Input validation: Query parameters (refresh)
 * - Output validation: Admin stats response schema
 * - Permission check: Requires `analytics:read` (and `analytics:write` for refresh)
 *
 * @requires `analytics:read` admin permission (`analytics:write` for refresh)
 * @returns Admin statistics object
 */
export const GET = createValidatedAdminHandler(
  adminStatsRequestSchema,
  adminStatsResponseSchema,
  async ({ data, context }) => {
    const { refresh: forceRefresh } = data;

    try {
      let stats;
      if (forceRefresh) {
        // Check for write permission when refreshing
        if (!context.admin.permissions.has('analytics:write')) {
          throw new Error(
            'analytics:write permission required to refresh statistics'
          );
        }

        logger.info('[api/admin/stats] Force refreshing statistics');
        stats = await refreshAdminStatistics();
      } else {
        stats = await getAdminStatistics();

        // If no cached stats exist, calculate fresh ones
        if (!stats) {
          logger.info(
            '[api/admin/stats] No cached stats found, calculating fresh'
          );
          stats = await refreshAdminStatistics();
        }
      }

      return stats;
    } catch (err) {
      if (err instanceof SuperAdminRequiredError) {
        throw error('Forbidden', { status: 403 });
      }

      if (
        err instanceof Error &&
        err.message.includes('analytics:write permission required')
      ) {
        throw error(err.message, { status: 403 });
      }

      throw err;
    }
  },
  {
    resource: 'admin.stats.read',
    requiredPermissions: ['analytics:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/stats',
  }
);
