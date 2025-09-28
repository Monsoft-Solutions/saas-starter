'use client';

import { useState } from 'react';
import { PricingCard } from './pricing-card';
import { PricingToggle, type BillingInterval } from './pricing-toggle';
import type { StripeProductWithPrices } from '@/lib/types/payments';
import type { UserSubscriptionStatus } from '@/lib/types/payments';

interface PricingPlansProps {
  /**
   * Products with pricing information from Stripe
   */
  products: StripeProductWithPrices[];
  /**
   * User's current subscription status (null if not authenticated or no subscription)
   */
  userSubscription?: UserSubscriptionStatus | null;
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
 * Fallback features for products that don't have metadata configured
 * These will be used if no features are found in Stripe metadata
 */
const FALLBACK_FEATURES: Record<string, string[]> = {
  // Legacy plan names (keep for backwards compatibility)
  Base: ['Unlimited Usage', 'Unlimited Workspace Members', 'Email Support'],
  Plus: [
    'Everything in Base, and:',
    'Early Access to New Features',
    '24/7 Support + Slack Access',
  ],
  Enterprise: [
    'Everything in Plus, and:',
    'Custom integrations',
    'Dedicated account manager',
    'SLA guarantees',
  ],
  // Current Stripe product names
  Starter: [
    'Unlimited Usage',
    'Unlimited Workspace Members',
    'Email Support',
    'Basic Analytics',
  ],
  Pro: [
    'Everything in Starter, and:',
    'Advanced Analytics',
    'Priority Support',
    'Custom Integrations',
    'Advanced Security Features',
  ],
};

/**
 * Reusable pricing plans component that displays products with pricing
 * Features are now loaded dynamically from Stripe product metadata
 * Can be used in both public and authenticated contexts
 */
export function PricingPlans({
  products,
  userSubscription,
  defaultInterval = 'month',
  className,
}: PricingPlansProps) {
  const [selectedInterval, setSelectedInterval] =
    useState<BillingInterval>(defaultInterval);

  // Filter out products that don't have the required pricing
  const validProducts = products.filter((product) => {
    if (selectedInterval === 'month') {
      return product.monthlyPrice !== null;
    } else {
      return product.yearlyPrice !== null;
    }
  });

  return (
    <div className={className}>
      {/* Billing interval toggle */}
      <PricingToggle value={selectedInterval} onChange={setSelectedInterval} />

      {/* Pricing cards grid */}
      <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {validProducts.map((product) => {
          // Get the price for the selected interval
          const price =
            selectedInterval === 'month'
              ? product.monthlyPrice
              : product.yearlyPrice;

          // Check if this is the user's current plan
          const isCurrentPlan =
            userSubscription?.stripeProductId === product.id;

          // Use popularity from Stripe metadata, fallback to name-based logic
          const isPopular =
            product.isPopular ??
            (product.name.toLowerCase() === 'pro' ||
              product.name.toLowerCase() === 'plus');

          // Use features from Stripe metadata, fallback to predefined features or default message
          const features =
            product.features.length > 0
              ? product.features
              : FALLBACK_FEATURES[product.name] || ['Contact us for details'];

          return (
            <PricingCard
              key={product.id}
              name={product.name}
              description={product.description}
              price={price}
              features={features}
              isCurrentPlan={isCurrentPlan}
              isPopular={isPopular}
            />
          );
        })}
      </div>

      {/* Message for authenticated users */}
      {userSubscription && (
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Current organization:{' '}
            <strong>{userSubscription.organizationName}</strong>
            {userSubscription.planName && (
              <span>
                {' '}
                • Current plan: <strong>{userSubscription.planName}</strong>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
