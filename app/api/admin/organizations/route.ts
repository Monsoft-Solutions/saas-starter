import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import {
  listAllOrganizations,
  getSubscriptionAnalytics,
} from '@/lib/db/queries/admin-organization.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/organizations
 *
 * List all organizations with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by organization name or slug (optional)
 * - subscriptionStatus: Filter by subscription status (optional)
 * - hasSubscription: Filter by subscription presence (true/false) (optional)
 * - limit: Number of results per page (default: 50)
 * - offset: Pagination offset (default: 0)
 * - analytics: Include subscription analytics (true/false) (optional)
 *
 * @requires Super-admin role
 * @returns Paginated list of organizations
 */
export async function GET(request: Request) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') ?? undefined;
    const subscriptionStatus =
      searchParams.get('subscriptionStatus') ?? undefined;
    const hasSubscriptionParam = searchParams.get('hasSubscription');
    const hasSubscription =
      hasSubscriptionParam !== null
        ? hasSubscriptionParam === 'true'
        : undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const includeAnalytics = searchParams.get('analytics') === 'true';

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

    const result = await listAllOrganizations({
      search,
      subscriptionStatus,
      hasSubscription,
      limit,
      offset,
    });

    // Optionally include subscription analytics
    if (includeAnalytics) {
      const analytics = await getSubscriptionAnalytics();
      return NextResponse.json({
        ...result,
        analytics,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[api/admin/organizations] Failed to load organizations', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to load organizations' },
      { status: 500 }
    );
  }
}
