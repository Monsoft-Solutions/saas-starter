'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  getSubscriptionTableData,
  getRevenueMetrics,
  getPlanDistribution,
  getRevenueTrend,
  getTopCustomers,
} from '@/lib/db/queries/admin-subscription-analytics.query';
import { SubscriptionTableFilters } from '@/lib/types/analytics/subscription-analytics.type';

/**
 * Server action to get subscription table data with filters and pagination.
 * Returns enriched organization data for the subscription table.
 * Requires the `analytics:read` admin permission.
 */
export const getSubscriptionTableDataAction = withPermission(
  'analytics:read',
  async (filters: SubscriptionTableFilters) => {
    return await getSubscriptionTableData(filters);
  },
  'admin.subscription-analytics.table'
);

/**
 * Server action to get revenue metrics for dashboard cards.
 * Includes MRR, ARR, ARPU, churn rate, etc.
 * Requires the `analytics:read` admin permission.
 */
export const getRevenueMetricsAction = withPermission(
  'analytics:read',
  async () => {
    return await getRevenueMetrics();
  },
  'admin.subscription-analytics.revenue-metrics'
);

/**
 * Server action to get plan distribution data for pie chart.
 * Shows count and MRR breakdown by plan.
 * Requires the `analytics:read` admin permission.
 */
export const getPlanDistributionAction = withPermission(
  'analytics:read',
  async () => {
    return await getPlanDistribution();
  },
  'admin.subscription-analytics.plan-distribution'
);

/**
 * Server action to get revenue trend data for line chart.
 * Returns last 30 days of MRR and active subscription data.
 * Requires the `analytics:read` admin permission.
 */
export const getRevenueTrendAction = withPermission(
  'analytics:read',
  async () => {
    return await getRevenueTrend();
  },
  'admin.subscription-analytics.revenue-trend'
);

/**
 * Server action to get top customers by MRR.
 * Returns organizations sorted by revenue contribution.
 * Requires the `analytics:read` admin permission.
 */
export const getTopCustomersAction = withPermission(
  'analytics:read',
  async (limit: number = 10) => {
    return await getTopCustomers(limit);
  },
  'admin.subscription-analytics.top-customers'
);
