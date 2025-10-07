import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import {
  listAllOrganizations,
  getSubscriptionAnalytics,
} from '@/lib/db/queries/admin-organization.query';
import { adminOrganizationListRequestSchema } from '@/lib/types/admin/admin-organization-list-request.schema';
import { adminOrganizationListResponseSchema } from '@/lib/types/admin/admin-organization-list-response.schema';

/**
 * GET /api/admin/organizations
 *
 * List all organizations with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by organization name or slug (optional)
 * - subscriptionStatus: Filter by subscription status (optional)
 * - hasSubscription: Filter by subscription presence (true/false) (optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 * - analytics: Include subscription analytics (true/false) (optional)
 *
 * Uses validated admin handler with:
 * - Input validation: Query parameters (search, subscriptionStatus, hasSubscription, limit, offset, analytics)
 * - Output validation: Organization list response schema
 * - Permission check: Requires `organizations:read` admin permission
 *
 * @requires `organizations:read` admin permission
 * @returns Paginated list of organizations with optional analytics
 */
export const GET = createValidatedAdminHandler(
  adminOrganizationListRequestSchema,
  adminOrganizationListResponseSchema,
  async ({ data }) => {
    const {
      search,
      subscriptionStatus,
      hasSubscription,
      limit,
      offset,
      analytics,
    } = data;

    const result = await listAllOrganizations({
      search,
      subscriptionStatus,
      hasSubscription,
      limit,
      offset,
    });

    // Optionally include subscription analytics
    if (analytics) {
      const analyticsData = await getSubscriptionAnalytics();
      return {
        ...result,
        analytics: analyticsData,
      };
    }

    return result;
  },
  {
    resource: 'admin.organizations.list',
    requiredPermissions: ['organizations:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/organizations',
  }
);
