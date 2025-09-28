/**
 * User's current subscription status with organization details
 */
export type UserSubscriptionStatus = {
  /** Organization ID */
  organizationId: string;
  /** Organization name */
  organizationName: string;
  /** Current Stripe product ID */
  stripeProductId: string | null;
  /** Current subscription ID */
  stripeSubscriptionId: string | null;
  /** Plan name (e.g., "Base", "Plus") */
  planName: string | null;
  /** Subscription status (active, trialing, canceled, etc.) */
  subscriptionStatus: string | null;
  /** Stripe customer ID */
  stripeCustomerId: string | null;
};
