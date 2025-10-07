import { NextResponse } from 'next/server';
import { ensureApiPermissions } from '@/lib/auth/api-permission';
import { getActivityLogById } from '@/lib/db/queries/admin-activity-log.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/activity/[id]
 *
 * Get detailed information about a single activity log entry.
 *
 * @requires `activity:read` admin permission
 * @param id Activity log ID (number)
 * @returns Activity log details with user information
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;

  try {
    const permissionCheck = await ensureApiPermissions(request, {
      resource: 'admin.activity.read',
      requiredPermissions: ['activity:read'],
    });

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid activity log ID' },
        { status: 400 }
      );
    }

    const activityLog = await getActivityLogById(id);

    if (!activityLog) {
      return NextResponse.json(
        { error: 'Activity log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(activityLog);
  } catch (error) {
    logger.error(
      '[api/admin/activity/[id]] Failed to get activity log details',
      {
        error,
        id: resolvedParams.id,
      }
    );

    return NextResponse.json(
      { error: 'Failed to load activity log details' },
      { status: 500 }
    );
  }
}
