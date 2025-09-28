import { getActiveOrganization } from '../queries/organization.query';
import type { UserSubscriptionStatus } from '@/lib/types/payments';

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

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      stripeProductId: organization.stripeProductId ?? null,
      stripeSubscriptionId: organization.stripeSubscriptionId ?? null,
      planName: organization.planName ?? null,
      subscriptionStatus: organization.subscriptionStatus ?? null,
      stripeCustomerId: organization.stripeCustomerId ?? null,
    };
  } catch (error) {
    console.error('Failed to get user subscription status:', error);
    return null;
  }
}
