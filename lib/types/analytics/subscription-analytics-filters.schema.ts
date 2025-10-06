import { z } from 'zod';

/**
 * Zod schema for subscription analytics filters
 */
export const subscriptionAnalyticsFiltersSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(['active', 'trialing', 'canceled', 'past_due', 'incomplete'])
    .optional(),
  planName: z.string().optional(),
  minMRR: z.coerce.number().positive().optional(),
  maxMRR: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().max(500).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type SubscriptionAnalyticsFilters = z.infer<
  typeof subscriptionAnalyticsFiltersSchema
>;
