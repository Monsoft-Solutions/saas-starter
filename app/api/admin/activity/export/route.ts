import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { exportActivityLogsToCSV } from '@/lib/db/queries/admin-activity-log.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/activity/export
 *
 * Export activity logs to CSV format.
 *
 * Query parameters:
 * - userId: Filter by user ID (optional)
 * - action: Filter by action type (optional)
 * - startDate: Filter by start date (ISO 8601) (optional)
 * - endDate: Filter by end date (ISO 8601) (optional)
 * - search: Search in user email or action (optional)
 * - limit: Number of results to export (default: 10000, max: 10000)
 *
 * @requires Super-admin role
 * @returns CSV file download
 */
export async function GET(request: Request) {
  try {
    // Verify super-admin access
    const context = await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const search = searchParams.get('search') ?? undefined;
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '10000', 10),
      10000
    );

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

    // Export activity logs to CSV
    const csvData = await exportActivityLogsToCSV({
      userId,
      action,
      startDate,
      endDate,
      search,
      limit,
    });

    // Log admin action
    await logActivity(
      context.user.id,
      'admin.activity.exported' as any,
      request.headers.get('x-forwarded-for') ?? undefined
    );

    logger.info('[api/admin/activity/export] Activity logs exported', {
      adminUserId: context.user.id,
      filters: { userId, action, startDate, endDate, search, limit },
    });

    // Return CSV file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `activity-logs-${timestamp}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('[api/admin/activity/export] Failed to export activity logs', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to export activity logs' },
      { status: 500 }
    );
  }
}
