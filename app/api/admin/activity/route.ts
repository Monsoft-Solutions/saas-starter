import { NextResponse } from 'next/server';
import { ensureApiPermissions } from '@/lib/auth/api-permission';
import {
  listAllActivityLogs,
  getActivityStatistics,
  getActivityBreakdown,
} from '@/lib/db/queries/admin-activity-log.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/activity
 *
 * List all activity logs with optional filtering and pagination.
 *
 * Query parameters:
 * - userId: Filter by user ID (optional)
 * - action: Filter by action type (optional)
 * - startDate: Filter by start date (ISO 8601) (optional)
 * - endDate: Filter by end date (ISO 8601) (optional)
 * - search: Search in user email or action (optional)
 * - limit: Number of results per page (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 * - includeStats: Include activity statistics (true/false) (optional)
 *
 * @requires `activity:read` admin permission
 * @returns Paginated list of activity logs
 */
export async function GET(request: Request) {
  try {
    const permissionCheck = await ensureApiPermissions(request, {
      resource: 'admin.activity.list',
      requiredPermissions: ['activity:read'],
    });

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const search = searchParams.get('search') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be between 1 and 1000)' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter (must be >= 0)' },
        { status: 400 }
      );
    }

    // Parse dates if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format (use ISO 8601)' },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format (use ISO 8601)' },
          { status: 400 }
        );
      }
    }

    const result = await listAllActivityLogs({
      userId,
      action,
      startDate,
      endDate,
      search,
      limit,
      offset,
    });

    // Optionally include activity statistics
    if (includeStats) {
      const [statistics, breakdown] = await Promise.all([
        getActivityStatistics(30),
        getActivityBreakdown(30),
      ]);

      return NextResponse.json({
        ...result,
        statistics,
        breakdown,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[api/admin/activity] Failed to load activity logs', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to load activity logs' },
      { status: 500 }
    );
  }
}
