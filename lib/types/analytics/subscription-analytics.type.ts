/**
 * Subscription analytics data type
 */
export type SubscriptionTableData = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationLogo: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  mrr: number;
  startDate: string | null;
  renewalDate: string | null;
  trialEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  customerLifetimeValue: number;
  memberCount: number;
};

/**
 * Subscription table filters
 */
export type SubscriptionTableFilters = {
  search?: string;
  status?: string;
  planName?: string;
  minMRR?: number;
  maxMRR?: number;
  limit?: number;
  offset?: number;
};

/**
 * Revenue metrics for dashboard
 */
export type RevenueMetrics = {
  totalMRR: number;
  totalARR: number;
  averageRevenuePerUser: number;
  totalActiveSubscriptions: number;
  newSubscriptionsThisMonth: number;
  churnedSubscriptionsThisMonth: number;
  churnRate: number;
  revenueGrowthRate: number;
};

/**
 * Plan distribution data for chart
 */
export type PlanDistribution = {
  planName: string;
  count: number;
  mrr: number;
  percentage: number;
};

/**
 * Revenue trend data point
 */
export type RevenueTrendDataPoint = {
  date: string;
  mrr: number;
  activeSubscriptions: number;
};
