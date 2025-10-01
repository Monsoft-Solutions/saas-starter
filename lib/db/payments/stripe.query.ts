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
        return {
          organizationId: organization.id,
          organizationName: organization.name,
          stripeProductId: organization.stripeProductId ?? null,
          stripeSubscriptionId: organization.stripeSubscriptionId ?? null,
          planName: organization.planName ?? null,
          subscriptionStatus: organization.subscriptionStatus ?? null,
          stripeCustomerId: organization.stripeCustomerId ?? null,
        };
      },
      { ttl: 300 } // Cache for 5 minutes
    );
  } catch (error) {
    logger.error('Failed to get user subscription status', { error });
    return null;
  }
}
