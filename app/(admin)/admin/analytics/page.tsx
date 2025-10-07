import {
  getSubscriptionTableData,
  getRevenueMetrics,
  getPlanDistribution,
  getRevenueTrend,
} from '@/lib/db/queries/admin-subscription-analytics.query';
import { SubscriptionTable } from '@/components/admin/analytics/subscription-table.component';
import { RevenueMetrics } from '@/components/admin/analytics/revenue-metrics.component';
import { PlanDistributionChart } from '@/components/admin/analytics/plan-distribution-chart.component';
import { RevenueTrendChart } from '@/components/admin/analytics/revenue-trend-chart.component';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireAdminContext } from '@/lib/auth/admin-context';

/**
 * Admin subscription analytics page.
 * Displays revenue metrics, subscription trends, and detailed subscription data.
 */
export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    planName?: string;
    minMRR?: string;
    maxMRR?: string;
    limit?: string;
    offset?: string;
  }>;
}) {
  await requireAdminContext();

  const params = await searchParams;

  // Parse search parameters
  const filters = {
    search: params.search,
    status: params.status as
      | 'active'
      | 'trialing'
      | 'canceled'
      | 'past_due'
      | 'incomplete'
      | undefined,
    planName: params.planName,
    minMRR: params.minMRR ? parseFloat(params.minMRR) : undefined,
    maxMRR: params.maxMRR ? parseFloat(params.maxMRR) : undefined,
    limit: parseInt(params.limit ?? '50', 10),
    offset: parseInt(params.offset ?? '0', 10),
  };

  // Fetch all data in parallel
  const [subscriptionsData, revenueMetrics, planDistribution, revenueTrend] =
    await Promise.all([
      getSubscriptionTableData(filters),
      getRevenueMetrics(),
      getPlanDistribution(),
      getRevenueTrend(),
    ]);

  // Convert to the format expected by the generic table (TableDataResponse)
  const initialData = {
    data: subscriptionsData.subscriptions,
    total: subscriptionsData.total,
    limit: subscriptionsData.limit,
    offset: subscriptionsData.offset,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription Analytics
        </h1>
        <p className="text-muted-foreground">
          Monitor revenue metrics, subscription trends, and customer data
        </p>
      </div>

      {/* Revenue Metrics Cards */}
      <RevenueMetrics data={revenueMetrics} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanDistributionChart data={planDistribution} />
        <RevenueTrendChart data={revenueTrend} />
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
          <CardDescription>
            View and analyze all active subscriptions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionTable
            initialData={initialData}
            initialFilters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
