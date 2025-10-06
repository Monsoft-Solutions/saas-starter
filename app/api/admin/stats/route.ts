import { NextResponse } from 'next/server';
import { ensureApiPermissions } from '@/lib/auth/api-permission';
import {
  getAdminStatistics,
  refreshAdminStatistics,
} from '@/lib/db/queries/admin-statistics.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/stats
 *
 * Retrieve cached admin statistics for dashboard.
 * Supports optional force refresh via ?refresh=true query parameter.
 *
 * @requires `analytics:read` admin permission (`analytics:write` for refresh)
 * @returns Admin statistics object
 */
export async function GET(request: Request) {
  try {
    const basePermission = await ensureApiPermissions(request, {
      resource: 'admin.stats.read',
      requiredPermissions: ['analytics:read'],
    });

    if (!basePermission.ok) {
      return basePermission.response;
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let stats;
    if (forceRefresh) {
      const refreshPermission = await ensureApiPermissions(request, {
        resource: 'admin.stats.refresh',
        requiredPermissions: ['analytics:write'],
      });

      if (!refreshPermission.ok) {
        return refreshPermission.response;
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

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('[api/admin/stats] Failed to get statistics', { error });

    return NextResponse.json(
      { error: 'Failed to load statistics' },
      { status: 500 }
    );
  }
}
