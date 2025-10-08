import { z } from 'zod';

/**
 * Subscription data item schema for analytics table
 */
export const subscriptionDataItemSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  organizationLogo: z.string().nullable(),
  planName: z.string().nullable(),
  subscriptionStatus: z.string(),
  startDate: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  memberCount: z.number(),
  mrr: z.number(),
  renewalDate: z.string().nullable(),
  trialEndDate: z.string().nullable(),
  customerLifetimeValue: z.number(),
});

export type SubscriptionDataItem = z.infer<typeof subscriptionDataItemSchema>;

/**
 * Response schema for subscription analytics API
 */
export const subscriptionAnalyticsResponseSchema = z
  .object({
    subscriptions: z.array(subscriptionDataItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  })
  .strict();

export type SubscriptionAnalyticsResponse = z.infer<
  typeof subscriptionAnalyticsResponseSchema
>;
