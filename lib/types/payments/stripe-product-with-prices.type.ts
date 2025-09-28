/**
 * Stripe product with associated pricing information
 * Used for displaying pricing plans with both monthly and yearly options
 */
export type StripeProductWithPrices = {
  /** Product ID from Stripe */
  id: string;
  /** Product name */
  name: string;
  /** Product description */
  description: string | null;
  /** Monthly pricing information */
  monthlyPrice: StripePrice | null;
  /** Yearly pricing information */
  yearlyPrice: StripePrice | null;
  /** Default price ID from Stripe */
  defaultPriceId: string | null;
  /** Features list extracted from Stripe metadata */
  features: string[];
  /** Whether this plan should be marked as popular (from metadata) */
  isPopular?: boolean;
};

/**
 * Simplified Stripe price information
 */
export type StripePrice = {
  /** Price ID from Stripe */
  id: string;
  /** Price amount in cents */
  unitAmount: number | null;
  /** Currency code (e.g., "usd") */
  currency: string;
  /** Billing interval (month, year) */
  interval: string | null;
  /** Trial period in days */
  trialPeriodDays: number | null;
};
