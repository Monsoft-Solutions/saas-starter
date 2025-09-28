import { getProductsWithPrices } from '@/lib/payments/stripe';
import { getUserSubscriptionStatus } from '@/lib/db/payments/stripe.query';
import { PricingPlans } from './pricing-plans';
import type { BillingInterval } from './pricing-toggle';
import type { ServerUser } from '@/lib/auth/server-context';

interface PricingPlansServerProps {
  /**
   * Optional user object - if provided, will fetch subscription status
   */
  user?: ServerUser | null;
  /**
   * Default billing interval to display
   */
  defaultInterval?: BillingInterval;
  /**
   * Additional CSS classes to apply to the container
   */
  className?: string;
}

/**
 * Server component that fetches pricing data and user subscription status
 * This is the main component to use in pages - it handles all data fetching
 */
export async function PricingPlansServer({
  user,
  defaultInterval,
  className,
}: PricingPlansServerProps) {
  // Fetch products with prices from Stripe
  const products = await getProductsWithPrices();

  // Fetch user subscription status if user is provided
  let userSubscription = null;
  if (user) {
    try {
      userSubscription = await getUserSubscriptionStatus();
    } catch (error) {
      console.error('Failed to fetch user subscription status:', error);
      // Continue without subscription data - component will handle gracefully
    }
  }

  return (
    <PricingPlans
      products={products}
      userSubscription={userSubscription}
      defaultInterval={defaultInterval}
      className={className}
    />
  );
}
