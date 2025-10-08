import {
  getAdminStatisticsAction,
  getUserGrowthDataAction,
} from '@/lib/actions/admin/get-statistics.action';
import { getPlanDistributionAction } from '@/lib/actions/admin/get-subscription-analytics.action';
import { MetricCard } from '@/components/admin/dashboard/metric-card.component';
import { QuickActions } from '@/components/admin/dashboard/quick-actions.component';
import { RecentActivity } from '@/components/admin/dashboard/recent-activity.component';
import { UserGrowthChart } from '@/components/admin/dashboard/user-growth-chart.component';
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart.component';
import { Users, Building2, CreditCard, DollarSign } from 'lucide-react';
import { Suspense } from 'react';
import { requireAdminContext } from '@/lib/auth/admin-context';

/**
 * Admin dashboard page.
 * Main landing page for the admin panel showing system metrics and overview.
 */
export default async function AdminDashboardPage() {
  const context = await requireAdminContext();
  const stats = await getAdminStatisticsAction();
  const userGrowthData = await getUserGrowthDataAction();
  const planDistribution = await getPlanDistributionAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {context.user.name || context.user.email}
        </p>
      </div>

      {stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              trend={
                stats.userGrowthRate !== null
                  ? {
                      value: stats.userGrowthRate,
                      isPositive: stats.userGrowthRate >= 0,
                    }
                  : undefined
              }
            />

            <MetricCard
              label="Total Organizations"
              value={stats.totalOrganizations.toLocaleString()}
              icon={Building2}
            />

            <MetricCard
              label="Active Subscriptions"
              value={stats.totalActiveSubscriptions.toLocaleString()}
              icon={CreditCard}
            />

            <MetricCard
              label="Monthly Revenue"
              value={`$${stats.totalMRR.toLocaleString()}`}
              icon={DollarSign}
              trend={
                stats.revenueGrowthRate !== null
                  ? {
                      value: stats.revenueGrowthRate,
                      isPositive: stats.revenueGrowthRate >= 0,
                    }
                  : undefined
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Active Users (30d)"
              value={stats.activeUsersLast30Days.toLocaleString()}
            />

            <MetricCard
              label="New Users (30d)"
              value={stats.newUsersLast30Days.toLocaleString()}
            />

            <MetricCard
              label="Trial Organizations"
              value={stats.trialOrganizations.toLocaleString()}
            />
          </div>

          <QuickActions />
        </>
      ) : (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No statistics available. Statistics will be calculated when activity
            occurs.
          </p>
        </div>
      )}

      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          <UserGrowthChart
            data={userGrowthData}
            totalUsers={stats.totalUsers}
            newUsersLast30Days={stats.newUsersLast30Days}
          />

          <RevenueChart
            totalMRR={stats.totalMRR}
            totalActiveSubscriptions={stats.totalActiveSubscriptions}
            revenueGrowthRate={stats.revenueGrowthRate}
            planDistribution={planDistribution.map((plan) => ({
              plan: plan.planName,
              count: plan.count,
              revenue: plan.mrr,
            }))}
          />
        </div>
      )}

      <Suspense
        fallback={
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Loading recent activity...
            </p>
          </div>
        }
      >
        <RecentActivity />
      </Suspense>
    </div>
  );
}
