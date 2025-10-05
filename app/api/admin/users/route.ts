import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { listAllUsers } from '@/lib/db/queries/admin-user.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/users
 *
 * List all users with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by email or name (optional)
 * - role: Filter by user role (optional)
 * - limit: Number of results per page (default: 50)
 * - offset: Pagination offset (default: 0)
 *
 * @requires Super-admin role
 * @returns Paginated list of users
 */
export async function GET(request: Request) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') ?? undefined;
    const role = searchParams.get('role') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Validate pagination parameters
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit parameter (must be between 1 and 100)' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter (must be >= 0)' },
        { status: 400 }
      );
    }

    const result = await listAllUsers({
      search,
      role,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[api/admin/users] Failed to load users', { error });

    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}
