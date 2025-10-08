import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import { listAllUsers } from '@/lib/db/queries/admin-user.query';
import { adminUserListRequestSchema } from '@/lib/types/admin/admin-user-list-request.schema';
import { adminUserListResponseSchema } from '@/lib/types/admin/admin-user-list-response.schema';

/**
 * GET /api/admin/users
 *
 * List all users with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by email or name (optional)
 * - role: Filter by user role (optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Uses validated admin handler with:
 * - Input validation: Query parameters (search, role, limit, offset)
 * - Output validation: User list response schema
 * - Permission check: Requires `users:read` admin permission
 *
 * @requires `users:read` admin permission
 * @returns Paginated list of users
 */
export const GET = createValidatedAdminHandler(
  adminUserListRequestSchema,
  adminUserListResponseSchema,
  async ({ data }) => {
    const { search, role, limit, offset } = data;

    const result = await listAllUsers({
      search,
      role,
      limit,
      offset,
    });

    // Convert to response format expected by the client
    return {
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },
  {
    resource: 'admin.users.list',
    requiredPermissions: ['users:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/users',
  }
);
