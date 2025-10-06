/**
 * Admin subscription analytics API endpoint.
 * GET /api/admin/analytics/subscriptions
 *
 * Returns paginated subscription data with filters.
 * Protected: Requires the `analytics:read` admin permission.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ensureApiPermissions } from '@/lib/auth/api-permission';
import { getSubscriptionTableData } from '@/lib/db/queries/admin-subscription-analytics.query';
import { subscriptionAnalyticsFiltersSchema } from '@/lib/types/analytics/subscription-analytics-filters.schema';
import logger from '@/lib/logger/logger.service';

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await ensureApiPermissions(request, {
      resource: 'admin.analytics.subscriptions',
      requiredPermissions: ['analytics:read'],
    });

    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const filters = subscriptionAnalyticsFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      planName: searchParams.get('planName') || undefined,
      minMRR: searchParams.get('minMRR') || undefined,
      maxMRR: searchParams.get('maxMRR') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    // Fetch subscription data
    const result = await getSubscriptionTableData(filters);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[api/admin/analytics/subscriptions] Failed to fetch data', {
      error,
    });

    return NextResponse.json(
      { error: 'Failed to load subscription data' },
      { status: 500 }
    );
  }
}
