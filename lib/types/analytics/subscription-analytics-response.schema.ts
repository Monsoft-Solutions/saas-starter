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
  startDate: z.date(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  memberCount: z.number(),
  mrr: z.number(),
});

export type SubscriptionDataItem = z.infer<typeof subscriptionDataItemSchema>;

/**
 * Response schema for subscription analytics API
 */
export const subscriptionAnalyticsResponseSchema = z
  .object({
    data: z.array(subscriptionDataItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strict();

export type SubscriptionAnalyticsResponse = z.infer<
  typeof subscriptionAnalyticsResponseSchema
>;
