/**
 * Stripe analytics service for fetching real revenue and subscription metrics.
 * Provides data for admin analytics dashboard.
 */
import { stripe } from './stripe';
import logger from '@/lib/logger/logger.service';
import type {
  RevenueMetrics,
  RevenueTrendDataPoint,
} from '@/lib/types/analytics/subscription-analytics.type';

/**
 * Fetches comprehensive revenue metrics from Stripe.
 * Includes MRR, ARR, ARPU, active subscriptions, and growth metrics.
 */
export async function getRevenueMetricsFromStripe(): Promise<RevenueMetrics | null> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all subscriptions (active and recently canceled)
    const [activeSubscriptions, recentSubscriptions] = await Promise.all([
      stripe.subscriptions.list({
        status: 'active',
        expand: ['data.items.data.price'],
        limit: 100,
      }),
      stripe.subscriptions.list({
        created: {
          gte: Math.floor(thirtyDaysAgo.getTime() / 1000),
        },
        expand: ['data.items.data.price'],
        limit: 100,
      }),
    ]);

    // Calculate total MRR from active subscriptions
    let totalMRR = 0;
    for (const subscription of activeSubscriptions.data) {
      for (const item of subscription.items.data) {
        const price = item.price;
        const unitAmount = price.unit_amount || 0;
        const quantity = item.quantity || 1;

        // Convert to monthly recurring revenue
        let monthlyAmount = (unitAmount * quantity) / 100;
        if (price.recurring?.interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        } else if (price.recurring?.interval === 'week') {
          monthlyAmount = monthlyAmount * 4.33; // Average weeks per month
        } else if (price.recurring?.interval === 'day') {
          monthlyAmount = monthlyAmount * 30;
        }

        totalMRR += monthlyAmount;
      }
    }

    // Calculate ARR (Annual Recurring Revenue)
    const totalARR = totalMRR * 12;

    // Count active subscriptions
    const activeCount = activeSubscriptions.data.length;

    // Calculate ARPU (Average Revenue Per User)
    const averageRevenuePerUser = activeCount > 0 ? totalMRR / activeCount : 0;

    // Count new subscriptions in the last 30 days
    const newSubscriptions = recentSubscriptions.data.filter(
      (sub) => sub.status === 'active' || sub.status === 'trialing'
    ).length;

    // Count canceled subscriptions in the last 30 days
    const canceledSubscriptions = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
    });

    const recentlyCanceled = canceledSubscriptions.data.filter((sub) => {
      const canceledAt = sub.canceled_at;
      return (
        canceledAt && canceledAt >= Math.floor(thirtyDaysAgo.getTime() / 1000)
      );
    }).length;

    // Calculate churn rate (canceled / total active at start of period)
    const totalAtStartOfPeriod = activeCount + recentlyCanceled;
    const churnRate =
      totalAtStartOfPeriod > 0
        ? (recentlyCanceled / totalAtStartOfPeriod) * 100
        : 0;

    // Calculate revenue growth (compare to 60 days ago)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodSubs = await stripe.subscriptions.list({
      status: 'active',
      created: {
        lte: Math.floor(thirtyDaysAgo.getTime() / 1000),
        gte: Math.floor(sixtyDaysAgo.getTime() / 1000),
      },
      expand: ['data.items.data.price'],
      limit: 100,
    });

    let previousMRR = 0;
    for (const subscription of previousPeriodSubs.data) {
      for (const item of subscription.items.data) {
        const price = item.price;
        const unitAmount = price.unit_amount || 0;
        const quantity = item.quantity || 1;
        let monthlyAmount = (unitAmount * quantity) / 100;

        if (price.recurring?.interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        }

        previousMRR += monthlyAmount;
      }
    }

    const revenueGrowthRate =
      previousMRR > 0 ? ((totalMRR - previousMRR) / previousMRR) * 100 : 0;

    logger.info('Fetched revenue metrics from Stripe', {
      totalMRR,
      totalARR,
      activeCount,
      newSubscriptions,
      recentlyCanceled,
    });

    return {
      totalMRR: Math.round(totalMRR * 100) / 100,
      totalARR: Math.round(totalARR * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser * 100) / 100,
      totalActiveSubscriptions: activeCount,
      newSubscriptionsThisMonth: newSubscriptions,
      churnedSubscriptionsThisMonth: recentlyCanceled,
      churnRate: Math.round(churnRate * 100) / 100,
      revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
    };
  } catch (error) {
    logger.error('Failed to fetch revenue metrics from Stripe', { error });
    return null;
  }
}

/**
 * Fetches revenue trend data from Stripe for the last N days.
 * Returns daily MRR and active subscription counts.
 */
export async function getRevenueTrendFromStripe(
  days: number = 30
): Promise<RevenueTrendDataPoint[]> {
  try {
    const now = new Date();

    // Fetch all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.items.data.price'],
      limit: 100,
    });

    // Create a map for daily data
    const dailyData = new Map<string, { mrr: number; count: number }>();

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyData.set(dateKey, { mrr: 0, count: 0 });
    }

    // For each subscription, check if it was active on each day
    for (const subscription of subscriptions.data) {
      const createdAt = new Date(subscription.created * 1000);
      const canceledAt = subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null;

      // Calculate MRR for this subscription
      let subscriptionMRR = 0;
      for (const item of subscription.items.data) {
        const price = item.price;
        const unitAmount = price.unit_amount || 0;
        const quantity = item.quantity || 1;
        let monthlyAmount = (unitAmount * quantity) / 100;

        if (price.recurring?.interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        } else if (price.recurring?.interval === 'week') {
          monthlyAmount = monthlyAmount * 4.33;
        } else if (price.recurring?.interval === 'day') {
          monthlyAmount = monthlyAmount * 30;
        }

        subscriptionMRR += monthlyAmount;
      }

      // Add to each day where subscription was active
      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - 1 - i));
        date.setHours(0, 0, 0, 0);

        // Check if subscription was active on this date
        const isAfterCreation = date >= createdAt;
        const isBeforeCancellation = !canceledAt || date < canceledAt;

        if (isAfterCreation && isBeforeCancellation) {
          const dateKey = date.toISOString().split('T')[0];
          const existing = dailyData.get(dateKey);
          if (existing) {
            existing.mrr += subscriptionMRR;
            existing.count += 1;
          }
        }
      }
    }

    // Convert map to array
    const result: RevenueTrendDataPoint[] = Array.from(dailyData.entries()).map(
      ([date, data]) => ({
        date,
        mrr: Math.round(data.mrr * 100) / 100,
        activeSubscriptions: data.count,
      })
    );

    logger.info('Fetched revenue trend from Stripe', {
      days,
      dataPoints: result.length,
    });

    return result;
  } catch (error) {
    logger.error('Failed to fetch revenue trend from Stripe', { error });
    return [];
  }
}

/**
 * Enriches subscription data with real-time Stripe information.
 * Fetches renewal dates, trial end dates, and accurate MRR.
 */
export async function enrichSubscriptionWithStripeData(
  stripeSubscriptionId: string
): Promise<{
  mrr: number;
  renewalDate: string | null;
  trialEndDate: string | null;
  customerLifetimeValue: number;
} | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
      {
        expand: ['items.data.price'],
      }
    );

    // Calculate MRR
    let mrr = 0;
    for (const item of subscription.items.data) {
      const price = item.price;
      const unitAmount = price.unit_amount || 0;
      const quantity = item.quantity || 1;
      let monthlyAmount = (unitAmount * quantity) / 100;

      if (price.recurring?.interval === 'year') {
        monthlyAmount = monthlyAmount / 12;
      } else if (price.recurring?.interval === 'week') {
        monthlyAmount = monthlyAmount * 4.33;
      } else if (price.recurring?.interval === 'day') {
        monthlyAmount = monthlyAmount * 30;
      }

      mrr += monthlyAmount;
    }

    // Cast to access properties (Stripe SDK types issue with Response wrapper)
    const sub = subscription as unknown as {
      current_period_end?: number;
      trial_end?: number;
    };

    // Get renewal date (current period end)
    const renewalDate = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    // Get trial end date
    const trialEndDate = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null;

    // Estimate customer lifetime value (simple: MRR * 24 months)
    const customerLifetimeValue = mrr * 24;

    return {
      mrr: Math.round(mrr * 100) / 100,
      renewalDate,
      trialEndDate,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
    };
  } catch (error) {
    logger.error('Failed to enrich subscription with Stripe data', {
      stripeSubscriptionId,
      error,
    });
    return null;
  }
}

/**
 * Batch enriches multiple subscriptions with Stripe data.
 * More efficient than calling enrichSubscriptionWithStripeData individually.
 */
export async function batchEnrichSubscriptions(
  stripeSubscriptionIds: string[]
): Promise<
  Map<
    string,
    {
      mrr: number;
      renewalDate: string | null;
      trialEndDate: string | null;
      customerLifetimeValue: number;
    }
  >
> {
  const enrichedData = new Map();

  // Process in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < stripeSubscriptionIds.length; i += batchSize) {
    const batch = stripeSubscriptionIds.slice(i, i + batchSize);
    const promises = batch.map(async (id) => {
      const data = await enrichSubscriptionWithStripeData(id);
      return { id, data };
    });

    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        enrichedData.set(result.value.id, result.value.data);
      }
    });

    // Add small delay between batches
    if (i + batchSize < stripeSubscriptionIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return enrichedData;
}
