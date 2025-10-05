import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
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
 * @requires Super-admin role
 * @returns Admin statistics object
 */
export async function GET(request: Request) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let stats;
    if (forceRefresh) {
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
