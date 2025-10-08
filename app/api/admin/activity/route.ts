import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import {
  listAllActivityLogs,
  getActivityStatistics,
  getActivityBreakdown,
} from '@/lib/db/queries/admin-activity-log.query';
import { adminActivityListRequestSchema } from '@/lib/types/admin/admin-activity-list-request.schema';
import { adminActivityListResponseSchema } from '@/lib/types/admin/admin-activity-list-response.schema';

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
 * Uses validated admin handler with:
 * - Input validation: Query parameters (userId, action, startDate, endDate, search, limit, offset, includeStats)
 * - Output validation: Activity list response schema
 * - Permission check: Requires `activity:read` admin permission
 *
 * @requires `activity:read` admin permission
 * @returns Paginated list of activity logs with optional statistics
 */
export const GET = createValidatedAdminHandler(
  adminActivityListRequestSchema,
  adminActivityListResponseSchema,
  async ({ data }) => {
    const {
      userId,
      action,
      startDate,
      endDate,
      search,
      limit,
      offset,
      includeStats,
    } = data;

    const result = await listAllActivityLogs({
      userId,
      action,
      startDate,
      endDate,
      search,
      limit,
      offset,
    });

    // Optionally include activity statistics and breakdown
    if (includeStats) {
      const [statistics, breakdown] = await Promise.all([
        getActivityStatistics(30),
        getActivityBreakdown(30),
      ]);

      return {
        ...result,
        statistics,
        breakdown,
      };
    }

    return result;
  },
  {
    resource: 'admin.activity.list',
    requiredPermissions: ['activity:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/activity',
  }
);
