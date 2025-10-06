/**
 * Admin subscription analytics query functions.
 * Provides detailed subscription and revenue data for analytics dashboard.
 */
import { db } from '../drizzle';
import { organization, member } from '../schemas';
import { eq, ilike, desc, and, sql, isNotNull } from 'drizzle-orm';
import type {
  SubscriptionTableFilters,
  SubscriptionTableData,
  RevenueMetrics,
  PlanDistribution,
  RevenueTrendDataPoint,
} from '@/lib/types/analytics/subscription-analytics.type';

/**
 * Plan pricing configuration
 * Used to calculate MRR and revenue metrics
 */
const PLAN_PRICING = {
  Basic: 10,
  Pro: 25,
  Enterprise: 100,
} as const;

/**
 * Get subscription table data with filters and pagination.
 * Returns enriched organization data for the subscription table.
 */
export async function getSubscriptionTableData(
  filters: SubscriptionTableFilters = {}
) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  const cacheKey = CacheKeys.custom(
    'admin',
    `subscription-table-${JSON.stringify(filters)}`
  );

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;

      // Build query conditions
      const conditions = [];

      // Only include organizations with subscriptions
      conditions.push(isNotNull(organization.stripeSubscriptionId));

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(ilike(organization.name, searchPattern));
      }

      if (filters.status) {
        conditions.push(eq(organization.subscriptionStatus, filters.status));
      }

      if (filters.planName) {
        conditions.push(eq(organization.planName, filters.planName));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get subscriptions with member count
      const [subscriptions, [{ count: totalCount }]] = await Promise.all([
        db
          .select({
            id: organization.id,
            organizationId: organization.id,
            organizationName: organization.name,
            organizationLogo: organization.logo,
            planName: organization.planName,
            subscriptionStatus: organization.subscriptionStatus,
            startDate: organization.createdAt,
            stripeCustomerId: organization.stripeCustomerId,
            stripeSubscriptionId: organization.stripeSubscriptionId,
            memberCount: sql<number>`(
              SELECT COUNT(*)::int
              FROM ${member}
              WHERE ${member}.organization_id = ${organization}.id
            )`,
          })
          .from(organization)
          .where(whereClause)
          .orderBy(desc(organization.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(organization)
          .where(whereClause),
      ]);

      // Enrich data with calculated fields
      const enrichedSubscriptions: SubscriptionTableData[] = subscriptions.map(
        (sub) => {
          const planName = sub.planName || 'Basic';
          const mrr = PLAN_PRICING[planName as keyof typeof PLAN_PRICING] || 0;

          // Estimate customer lifetime value (simple calculation: MRR * 12 months)
          const customerLifetimeValue = mrr * 12;

          return {
            ...sub,
            startDate: sub.startDate ? sub.startDate.toISOString() : null,
            mrr,
            renewalDate: null, // Could be calculated from Stripe subscription data
            trialEndDate: null, // Could be fetched from Stripe
            customerLifetimeValue,
          };
        }
      );

      // Apply MRR filters if provided (after enrichment)
      let filteredSubscriptions = enrichedSubscriptions;

      if (filters.minMRR !== undefined) {
        filteredSubscriptions = filteredSubscriptions.filter(
          (sub) => sub.mrr >= (filters.minMRR ?? 0)
        );
      }

      if (filters.maxMRR !== undefined) {
        filteredSubscriptions = filteredSubscriptions.filter(
          (sub) => sub.mrr <= (filters.maxMRR ?? Infinity)
        );
      }

      return {
        subscriptions: filteredSubscriptions,
        total: Number(totalCount),
        limit,
        offset,
        hasMore: offset + filteredSubscriptions.length < Number(totalCount),
      };
    },
    { ttl: 60 } // Cache for 1 minute
  );
}

/**
 * Get revenue metrics for dashboard cards.
 * Includes MRR, ARR, ARPU, churn rate, etc.
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'revenue-metrics'),
    async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoISOString = thirtyDaysAgo.toISOString();

      const [currentMetrics] = await db
        .select({
          activeSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'active')::int`,
          totalMRR: sql<number>`
            COALESCE(SUM(CASE
              WHEN ${organization.planName} = 'Basic' AND ${organization.subscriptionStatus} = 'active' THEN 10
              WHEN ${organization.planName} = 'Pro' AND ${organization.subscriptionStatus} = 'active' THEN 25
              WHEN ${organization.planName} = 'Enterprise' AND ${organization.subscriptionStatus} = 'active' THEN 100
              ELSE 0
            END), 0)
          `,
          newSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.createdAt} >= ${thirtyDaysAgoISOString}::timestamp AND ${organization.stripeSubscriptionId} IS NOT NULL)::int`,
          churnedSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'canceled')::int`,
        })
        .from(organization);

      const totalMRR = Number(currentMetrics.totalMRR);
      const totalARR = totalMRR * 12;
      const activeSubscriptions = Number(currentMetrics.activeSubscriptions);
      const averageRevenuePerUser =
        activeSubscriptions > 0 ? totalMRR / activeSubscriptions : 0;

      // Calculate churn rate (simplified: canceled / total with subscriptions)
      const totalWithSubscriptions =
        activeSubscriptions + Number(currentMetrics.churnedSubscriptions);
      const churnRate =
        totalWithSubscriptions > 0
          ? (Number(currentMetrics.churnedSubscriptions) /
              totalWithSubscriptions) *
            100
          : 0;

      // Calculate revenue growth rate (simplified: would need historical data)
      const revenueGrowthRate = 0; // Placeholder - would calculate from historical data

      return {
        totalMRR,
        totalARR,
        averageRevenuePerUser,
        totalActiveSubscriptions: activeSubscriptions,
        newSubscriptionsThisMonth: Number(currentMetrics.newSubscriptions),
        churnedSubscriptionsThisMonth: Number(
          currentMetrics.churnedSubscriptions
        ),
        churnRate,
        revenueGrowthRate,
      };
    },
    { ttl: 60 } // Cache for 1 minute
  );
}

/**
 * Get plan distribution data for pie chart.
 * Shows count and MRR breakdown by plan.
 */
export async function getPlanDistribution(): Promise<PlanDistribution[]> {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'plan-distribution'),
    async () => {
      const [distribution] = await db
        .select({
          basicCount: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Basic' AND ${organization.subscriptionStatus} = 'active')::int`,
          proCount: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Pro' AND ${organization.subscriptionStatus} = 'active')::int`,
          enterpriseCount: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Enterprise' AND ${organization.subscriptionStatus} = 'active')::int`,
          totalActive: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'active')::int`,
        })
        .from(organization);

      const basicCount = Number(distribution.basicCount);
      const proCount = Number(distribution.proCount);
      const enterpriseCount = Number(distribution.enterpriseCount);
      const totalActive = Number(distribution.totalActive);

      const plans: PlanDistribution[] = [
        {
          planName: 'Basic',
          count: basicCount,
          mrr: basicCount * PLAN_PRICING.Basic,
          percentage: totalActive > 0 ? (basicCount / totalActive) * 100 : 0,
        },
        {
          planName: 'Pro',
          count: proCount,
          mrr: proCount * PLAN_PRICING.Pro,
          percentage: totalActive > 0 ? (proCount / totalActive) * 100 : 0,
        },
        {
          planName: 'Enterprise',
          count: enterpriseCount,
          mrr: enterpriseCount * PLAN_PRICING.Enterprise,
          percentage:
            totalActive > 0 ? (enterpriseCount / totalActive) * 100 : 0,
        },
      ];

      return plans.filter((plan) => plan.count > 0);
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Get revenue trend data for line chart.
 * Returns last 30 days of MRR and active subscription data.
 */
export async function getRevenueTrend(): Promise<RevenueTrendDataPoint[]> {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'revenue-trend'),
    async () => {
      // For now, return placeholder data
      // In a real implementation, this would query historical subscription data
      const today = new Date();
      const dataPoints: RevenueTrendDataPoint[] = [];

      // Generate last 30 days of data (placeholder)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        dataPoints.push({
          date: date.toISOString().split('T')[0],
          mrr: 0, // Would calculate from historical data
          activeSubscriptions: 0, // Would calculate from historical data
        });
      }

      return dataPoints;
    },
    { ttl: 3600 } // Cache for 1 hour
  );
}

/**
 * Get top customers by MRR.
 * Returns organizations sorted by revenue contribution.
 */
export async function getTopCustomers(limit: number = 10) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', `top-customers-${limit}`),
    async () => {
      const organizations = await db
        .select({
          id: organization.id,
          name: organization.name,
          logo: organization.logo,
          planName: organization.planName,
          subscriptionStatus: organization.subscriptionStatus,
          createdAt: organization.createdAt,
        })
        .from(organization)
        .where(eq(organization.subscriptionStatus, 'active'))
        .orderBy(
          sql`CASE
            WHEN ${organization.planName} = 'Enterprise' THEN 3
            WHEN ${organization.planName} = 'Pro' THEN 2
            WHEN ${organization.planName} = 'Basic' THEN 1
            ELSE 0
          END DESC`,
          desc(organization.createdAt)
        )
        .limit(limit);

      return organizations.map((org) => ({
        ...org,
        createdAt: org.createdAt ? org.createdAt.toISOString() : null,
        mrr: PLAN_PRICING[org.planName as keyof typeof PLAN_PRICING] || 0,
      }));
    },
    { ttl: 60 } // Cache for 1 minute
  );
}
