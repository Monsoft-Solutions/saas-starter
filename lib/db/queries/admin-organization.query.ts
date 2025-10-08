/**
 * Admin organization query functions.
 * Provides cached access to organization data for the admin panel.
 */
import { db } from '../drizzle';
import { organization, member, user } from '../schemas';
import { eq, ilike, or, desc, and, sql, isNotNull } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';
import type { OrganizationListFilters } from '@/lib/types/admin';

/**
 * List all organizations with filters and pagination.
 * Cached for performance.
 */
export async function listAllOrganizations(
  filters: OrganizationListFilters = {}
) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  const cacheKey = CacheKeys.custom(
    'admin',
    `organizations-list-${JSON.stringify(filters)}`
  );

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const limit = filters.limit ?? 10;
      const offset = filters.offset ?? 0;

      // Build query conditions
      const conditions = [];

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(
          or(
            ilike(organization.name, searchPattern),
            ilike(organization.slug, searchPattern)
          )
        );
      }

      if (filters.subscriptionStatus) {
        conditions.push(
          eq(organization.subscriptionStatus, filters.subscriptionStatus)
        );
      }

      if (filters.hasSubscription !== undefined) {
        if (filters.hasSubscription) {
          conditions.push(isNotNull(organization.stripeSubscriptionId));
        } else {
          conditions.push(sql`${organization.stripeSubscriptionId} IS NULL`);
        }
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get organizations with member count
      const [data, [{ count: totalCount }]] = await Promise.all([
        db
          .select({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
            createdAt: organization.createdAt,
            stripeCustomerId: organization.stripeCustomerId,
            stripeSubscriptionId: organization.stripeSubscriptionId,
            stripeProductId: organization.stripeProductId,
            planName: organization.planName,
            subscriptionStatus: organization.subscriptionStatus,
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

      return {
        data,
        total: Number(totalCount),
        limit,
        offset,
        hasMore: offset + data.length < Number(totalCount),
      };
    },
    { ttl: 60 } // Cache for 1 minute
  );
}

/**
 * Get organization with full details (members, subscription).
 * Cached for performance.
 */
export async function getOrganizationWithDetails(organizationId: string) {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', `organization-details-${organizationId}`),
    async () => {
      const [orgRecord] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1);

      if (!orgRecord) {
        return null;
      }

      // Get organization members with user details
      const members = await db
        .select({
          userId: member.userId,
          role: member.role,
          joinedAt: member.createdAt,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image,
          userRole: user.role,
          userBanned: user.banned,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, organizationId))
        .orderBy(desc(member.createdAt));

      return {
        ...orgRecord,
        members,
        memberCount: members.length,
      };
    },
    { ttl: 120 } // Cache for 2 minutes
  );
}

/**
 * Get subscription analytics for organizations.
 * Cached for performance.
 */
export async function getSubscriptionAnalytics() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'subscription-analytics'),
    async () => {
      const [analytics] = await db
        .select({
          totalOrganizations: sql<number>`count(*)::int`,
          withSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.stripeSubscriptionId} IS NOT NULL)::int`,
          activeSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'active')::int`,
          trialSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'trialing')::int`,
          canceledSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'canceled')::int`,
          pastDueSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'past_due')::int`,
          // Plan distribution
          basicPlan: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Basic')::int`,
          proPlan: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Pro')::int`,
          enterprisePlan: sql<number>`count(*) FILTER (WHERE ${organization.planName} = 'Enterprise')::int`,
          // Revenue metrics
          totalMRR: sql<number>`
          COALESCE(SUM(CASE
            WHEN ${organization.planName} = 'Basic' AND ${organization.subscriptionStatus} = 'active' THEN 10
            WHEN ${organization.planName} = 'Pro' AND ${organization.subscriptionStatus} = 'active' THEN 25
            WHEN ${organization.planName} = 'Enterprise' AND ${organization.subscriptionStatus} = 'active' THEN 100
            ELSE 0
          END), 0)
        `,
        })
        .from(organization);

      return analytics;
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Search organizations by name or slug.
 * Optimized with ILIKE for PostgreSQL.
 */
export async function searchOrganizations(query: string, limit: number = 20) {
  const searchPattern = `%${query}%`;

  const results = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      planName: organization.planName,
      subscriptionStatus: organization.subscriptionStatus,
    })
    .from(organization)
    .where(
      or(
        ilike(organization.name, searchPattern),
        ilike(organization.slug, searchPattern)
      )
    )
    .limit(limit);

  return results;
}

/**
 * Get organization statistics grouped by status.
 * Cached for performance.
 */
export async function getOrganizationStatistics() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'organization-statistics'),
    async () => {
      const [stats] = await db
        .select({
          totalOrganizations: sql<number>`count(*)::int`,
          withActiveSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'active')::int`,
          withCanceledSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'canceled')::int`,
          withTrialSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.subscriptionStatus} = 'trialing')::int`,
          withoutSubscriptions: sql<number>`count(*) FILTER (WHERE ${organization.stripeSubscriptionId} IS NULL)::int`,
        })
        .from(organization);

      return stats;
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Delete organization (admin only).
 * Invalidates organization cache.
 */
export async function deleteOrganizationById(organizationId: string) {
  try {
    // Delete all members first (foreign key constraint)
    await db.delete(member).where(eq(member.organizationId, organizationId));

    // Delete organization
    await db.delete(organization).where(eq(organization.id, organizationId));

    logger.info('[admin-organization] Organization deleted', {
      organizationId,
    });

    // Invalidate cache
    const { cacheService, CacheKeys } = await import('@/lib/cache');
    await cacheService.delete(
      CacheKeys.custom('admin', `organization-details-${organizationId}`)
    );

    // Invalidate organization list cache
    await cacheService.invalidatePattern('admin:organizations-list-*');
  } catch (error) {
    logger.error('[admin-organization] Failed to delete organization', {
      error,
      organizationId,
    });
    throw error;
  }
}
