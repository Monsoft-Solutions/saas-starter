/**
 * Admin dashboard statistics type.
 * Used to display metrics on the admin dashboard.
 */
export type DashboardStats = {
  totalUsers: number;
  activeUsersLast30Days: number;
  newUsersLast30Days: number;
  totalOrganizations: number;
  organizationsWithSubscriptions: number;
  totalMRR: number;
  totalActiveSubscriptions: number;
  trialOrganizations: number;
  userGrowthRate: number | null;
  revenueGrowthRate: number | null;
  churnRate: number | null;
  calculatedAt: Date;
  calculationDurationMs: number | null;
};
