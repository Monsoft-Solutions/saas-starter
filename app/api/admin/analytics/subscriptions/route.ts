/**
 * Admin subscription analytics API endpoint.
 * GET /api/admin/analytics/subscriptions
 *
 * Returns paginated subscription data with filters.
 * Protected: Super admin only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getSubscriptionTableData } from '@/lib/db/queries/admin-subscription-analytics.query';
import { subscriptionAnalyticsFiltersSchema } from '@/lib/types/analytics/subscription-analytics-filters.schema';
import logger from '@/lib/logger/logger.service';

export async function GET(request: NextRequest) {
  try {
    // Verify super-admin access
    await requireSuperAdminContext();

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

    if (error instanceof Error && error.name === 'SuperAdminRequiredError') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to load subscription data' },
      { status: 500 }
    );
  }
}
