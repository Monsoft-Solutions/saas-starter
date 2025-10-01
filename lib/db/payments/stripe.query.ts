import { getActiveOrganization } from '../queries/organization.query';
import type { UserSubscriptionStatus } from '@/lib/types/payments';
import logger from '@/lib/logger/logger.service';
import { cacheService, CacheKeys } from '@/lib/cache';

/**
 * Get the current user's active subscription details
 * @returns UserSubscriptionStatus object or null if no active organization or subscription
 */
export async function getUserSubscriptionStatus(): Promise<UserSubscriptionStatus | null> {
  try {
    const organization = await getActiveOrganization();

    if (!organization) {
      return null;
    }

    // Cache the subscription status with organization ID as key
    return cacheService.getOrSet(
      CacheKeys.organizationSubscription(organization.id),
      async () => {
        // Re-fetch organization data inside callback to ensure cache is effective
        const org = await getActiveOrganization();
        if (!org) {
          return null;
        }

        return {
          organizationId: org.id,
          organizationName: org.name,
          stripeProductId: org.stripeProductId ?? null,
          stripeSubscriptionId: org.stripeSubscriptionId ?? null,
          planName: org.planName ?? null,
          subscriptionStatus: org.subscriptionStatus ?? null,
          stripeCustomerId: org.stripeCustomerId ?? null,
        };
      },
      { ttl: 300 } // Cache for 5 minutes
    );
  } catch (error) {
    logger.error('Failed to get user subscription status', { error });
    return null;
  }
}
