/**
 * Stripe integration surface covering checkout, billing portal access, webhook synchronization,
 * and metadata parsing. Ensures the application speaks a single language with Stripe.
 */
import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import {
  getOrganizationByStripeCustomerId,
  updateOrganizationSubscription,
} from '@/lib/db/queries';
import { APP_BASE_PATH } from '@/config/navigation';
import { env } from '../env';
import type { StripeProductWithPrices } from '@/lib/types/payments';
import {
  UnauthorizedError,
  requireServerContext,
} from '@/lib/auth/server-context';
import {
  StripeProductMetadataSchema,
  FeaturesArraySchema,
  FeatureKeySchema,
} from '@/lib/types/payments/stripe-metadata.schema';
import logger from '@/lib/logger/logger.service';

/**
 * Shared Stripe SDK client configured with the project's canonical API version.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

type OrganizationRecord = NonNullable<
  Awaited<ReturnType<typeof getOrganizationByStripeCustomerId>>
>;

/**
 * Parameters expected by the checkout orchestration helper.
 */
type CheckoutSessionArgs = {
  priceId: string;
  userOverride?: {
    id: string;
    email: string;
  };
};

/**
 * Creates a Stripe Checkout session, falling back to BetterAuth enrollment if the caller is anonymous.
 */
export async function createCheckoutSession({
  priceId,
  userOverride,
}: CheckoutSessionArgs) {
  let checkoutUser = userOverride ?? null;

  try {
    const { user } = await requireServerContext();
    checkoutUser = {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) {
      throw error;
    }

    // When the caller is anonymous (e.g. early checkout flow), rely on the override or force auth.
    if (!checkoutUser) {
      redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }
  }

  if (!checkoutUser?.email) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: checkoutUser.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.BASE_URL}/pricing`,
    client_reference_id: checkoutUser.id,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
    },
  });

  redirect(stripeSession.url!);
}

/**
 * Generates a Billing Portal session so organization owners can manage subscriptions.
 */
export async function createCustomerPortalSession(
  organization: Pick<OrganizationRecord, 'stripeCustomerId' | 'stripeProductId'>
) {
  if (!organization.stripeCustomerId || !organization.stripeProductId) {
    redirect('/pricing');
  }

  const baseUrl = (env.BASE_URL ?? '').replace(/\/$/, '');
  const appReturnUrl = baseUrl ? `${baseUrl}${APP_BASE_PATH}` : APP_BASE_PATH;

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(
      organization.stripeProductId
    );
    if (!product.active) {
      throw new Error("Organization's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription',
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id),
            },
          ],
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ],
          },
        },
        payment_method_update: {
          enabled: true,
        },
      },
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId,
    return_url: appReturnUrl,
    configuration: configuration.id,
  });
}

/**
 * Synchronizes BetterAuth organizations with Stripe subscription lifecycle events.
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const organization = await getOrganizationByStripeCustomerId(customerId);

  if (!organization) {
    logger.error('Organization not found for Stripe customer', { customerId });
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    const product = plan?.product;
    const productId =
      typeof product === 'string' ? product : (product?.id ?? null);
    const productName =
      typeof product === 'object' && product !== null && 'name' in product
        ? product.name
        : null;

    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: productId,
      planName: productName,
      subscriptionStatus: status,
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateOrganizationSubscription(organization.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status,
    });
  }
}

/**
 * Retrieves recurring Stripe prices in a lightweight shape for UI consumption.
 */
export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring',
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
  }));
}

/**
 * Fetches active Stripe products and exposes the essential descriptive fields.
 */
export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id,
  }));
}

/**
 * Derives a list of product features from Stripe metadata using layered parsing strategies.
 */
function parseProductFeatures(metadata: Record<string, string>): string[] {
  try {
    // First, validate the metadata structure with Zod
    const validatedMetadata = StripeProductMetadataSchema.parse(metadata);

    // Method 1: Features stored as JSON array in metadata
    if (validatedMetadata.features) {
      try {
        const parsedFeatures = JSON.parse(validatedMetadata.features);
        // Validate that the parsed JSON is an array of strings
        const validatedFeatures = FeaturesArraySchema.parse(parsedFeatures);
        return validatedFeatures;
      } catch (parseError) {
        logger.warn('Invalid JSON in features metadata', { error: parseError });
        // Continue to next method
      }
    }

    // Method 2: Features stored as comma-separated values
    if (validatedMetadata.feature_list) {
      const features = validatedMetadata.feature_list
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0); // Remove empty strings

      if (features.length > 0) {
        return features;
      }
    }

    // Method 3: Individual feature metadata keys (feature_1, feature_2, etc.)
    const features: string[] = [];
    Object.keys(validatedMetadata)
      .filter((key) => {
        try {
          FeatureKeySchema.parse(key);
          return true;
        } catch {
          return false;
        }
      })
      .sort()
      .forEach((key) => {
        const value = validatedMetadata[key];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          features.push(value.trim());
        }
      });

    return features;
  } catch (validationError) {
    logger.error('Invalid metadata structure', { error: validationError });
    return [];
  }
}

/**
 * Interprets metadata flags that mark a product as popular in marketing surfaces.
 */
function parseProductPopularity(metadata: Record<string, string>): boolean {
  try {
    const validatedMetadata = StripeProductMetadataSchema.parse(metadata);

    return (
      validatedMetadata.popular === 'true' ||
      validatedMetadata.is_popular === 'true'
    );
  } catch (validationError) {
    logger.error('Invalid metadata structure for popularity', {
      error: validationError,
    });
    return false;
  }
}

/**
 * Aggregates Stripe products with their monthly/yearly prices and normalized metadata hints.
 */
export async function getProductsWithPrices(): Promise<
  StripeProductWithPrices[]
> {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  // Try to get from cache first
  return cacheService.getOrSet(
    CacheKeys.stripeProducts(),
    async () => {
      // Fetch all active products
      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      // Fetch all active prices for recurring subscriptions
      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product'],
      });

      return buildProductsWithPrices(products, prices);
    },
    { ttl: 3600 } // Cache for 1 hour
  );
}

/**
 * Helper function to build products with prices data structure
 */
function buildProductsWithPrices(
  products: Stripe.ApiList<Stripe.Product>,
  prices: Stripe.ApiList<Stripe.Price>
): StripeProductWithPrices[] {
  // Group prices by product ID and billing interval
  const pricesByProduct = new Map<
    string,
    { monthly?: Stripe.Price; yearly?: Stripe.Price }
  >();

  prices.data.forEach((price) => {
    const productId =
      typeof price.product === 'string' ? price.product : price.product.id;
    const interval = price.recurring?.interval;

    if (!pricesByProduct.has(productId)) {
      pricesByProduct.set(productId, {});
    }

    const productPrices = pricesByProduct.get(productId)!;

    if (interval === 'month') {
      productPrices.monthly = price;
    } else if (interval === 'year') {
      productPrices.yearly = price;
    }
  });

  // Transform products to include price information and features
  return products.data.map((product): StripeProductWithPrices => {
    const productPrices = pricesByProduct.get(product.id) || {};

    const monthlyPrice = productPrices.monthly
      ? {
          id: productPrices.monthly.id,
          unitAmount: productPrices.monthly.unit_amount,
          currency: productPrices.monthly.currency,
          interval: productPrices.monthly.recurring?.interval || null,
          trialPeriodDays:
            productPrices.monthly.recurring?.trial_period_days || null,
        }
      : null;

    const yearlyPrice = productPrices.yearly
      ? {
          id: productPrices.yearly.id,
          unitAmount: productPrices.yearly.unit_amount,
          currency: productPrices.yearly.currency,
          interval: productPrices.yearly.recurring?.interval || null,
          trialPeriodDays:
            productPrices.yearly.recurring?.trial_period_days || null,
        }
      : null;

    // Extract features and popularity from metadata using Zod validation
    const features = parseProductFeatures(product.metadata || {});
    const isPopular = parseProductPopularity(product.metadata || {});

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      monthlyPrice,
      yearlyPrice,
      defaultPriceId:
        typeof product.default_price === 'string'
          ? product.default_price
          : product.default_price?.id || null,
      features,
      isPopular,
    };
  });
}

/**
 * Fetches plan distribution data from Stripe for analytics dashboard
 * Returns active subscription counts and revenue by plan
 */
export async function getPlanDistributionFromStripe() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('stripe', 'plan-distribution'),
    async () => {
      try {
        console.log('[Stripe] Fetching subscriptions...');
        // Fetch all subscriptions (not just active) to debug
        const subscriptions = await stripe.subscriptions.list({
          // status: 'active', // Temporarily remove status filter
          expand: ['data.items.data'],
          limit: 100, // Increase if you have many subscriptions
        });

        // Filter to active only for processing
        const activeSubscriptions = subscriptions.data.filter(
          (sub) => sub.status === 'active'
        );

        if (activeSubscriptions.length === 0) {
          // Test basic API connectivity
          try {
            const testProducts = await stripe.products.list({ limit: 1 });
            console.log(
              `[Stripe] API test successful, found ${testProducts.data.length} products`
            );
          } catch (apiError) {
            console.error('[Stripe] API test failed:', apiError);
          }
        }

        // Group subscriptions by product name
        const planDistribution = new Map<
          string,
          { count: number; revenue: number }
        >();

        for (const subscription of activeSubscriptions) {
          for (const item of subscription.items.data) {
            const price = item.price;
            const product = price?.product;

            // Get product name
            let productName = 'Unknown';
            if (
              typeof product === 'object' &&
              product &&
              'name' in product &&
              product.name
            ) {
              productName = product.name;
            } else if (typeof product === 'string') {
              // If product is just an ID, we might need to fetch it
              try {
                const productData = await stripe.products.retrieve(product);
                productName = productData.name;
              } catch (error) {
                logger.warn('Failed to fetch product details', {
                  productId: product,
                  error,
                });
                continue;
              }
            }

            // Calculate revenue for this subscription item
            const unitAmount = price?.unit_amount || 0;
            const quantity = item.quantity || 1;
            const revenue = (unitAmount * quantity) / 100; // Convert from cents

            const existing = planDistribution.get(productName) || {
              count: 0,
              revenue: 0,
            };
            planDistribution.set(productName, {
              count: existing.count + 1,
              revenue: existing.revenue + revenue,
            });
          }
        }

        // Convert to array format expected by the chart
        const result = Array.from(planDistribution.entries()).map(
          ([plan, data]) => ({
            planName: plan,
            count: data.count,
            mrr: Math.round(data.revenue), // Round to nearest dollar
            percentage: 0, // Will be calculated later based on total
          })
        );

        // Calculate percentages
        const totalSubscriptions = result.reduce(
          (sum, plan) => sum + plan.count,
          0
        );
        result.forEach((plan) => {
          plan.percentage =
            totalSubscriptions > 0
              ? (plan.count / totalSubscriptions) * 100
              : 0;
        });

        // Sort by count descending
        result.sort((a, b) => b.count - a.count);

        logger.info('Fetched plan distribution from Stripe', {
          totalPlans: result.length,
          totalSubscriptions,
        });

        return result;
      } catch (error) {
        logger.error('Failed to fetch plan distribution from Stripe', {
          error,
        });
        // Return empty array as fallback - UI will show placeholder data
        return [];
      }
    },
    { ttl: 300 } // Cache for 5 minutes
  );
}

/**
 * Invalidate Stripe products cache
 * Call this when Stripe products/prices are updated via webhook
 */
export async function invalidateStripeProductsCache(): Promise<void> {
  const { cacheService, CacheKeys } = await import('@/lib/cache');
  await cacheService.delete(CacheKeys.stripeProducts());
  logger.info('Stripe products cache invalidated');
}
