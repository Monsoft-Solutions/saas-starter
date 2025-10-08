import { z } from 'zod';

/**
 * Organization table data schema for admin organization list responses.
 * Represents a single organization row in the admin organizations table.
 */
export const organizationTableDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo: z.string().nullable(),
  createdAt: z.coerce.date(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  stripeProductId: z.string().nullable(),
  planName: z.string().nullable(),
  subscriptionStatus: z.string().nullable(),
  memberCount: z.number().int().min(0),
});

/**
 * Subscription analytics schema (optional, included when analytics=true).
 * Matches the structure returned by getSubscriptionAnalytics query.
 */
export const subscriptionAnalyticsSchema = z.object({
  totalOrganizations: z.number().int().min(0),
  withSubscriptions: z.number().int().min(0),
  activeSubscriptions: z.number().int().min(0),
  trialSubscriptions: z.number().int().min(0),
  canceledSubscriptions: z.number().int().min(0),
  pastDueSubscriptions: z.number().int().min(0),
  basicPlan: z.number().int().min(0),
  proPlan: z.number().int().min(0),
  enterprisePlan: z.number().int().min(0),
  totalMRR: z.number().min(0),
});

/**
 * Admin organization list response schema.
 * Returns paginated list of organizations with metadata.
 */
export const adminOrganizationListResponseSchema = z.object({
  data: z.array(organizationTableDataSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
  analytics: subscriptionAnalyticsSchema.optional(),
});

/**
 * Admin organization list response type (inferred from schema).
 */
export type AdminOrganizationListResponse = z.infer<
  typeof adminOrganizationListResponseSchema
>;

/**
 * Organization table data type (inferred from schema).
 */
export type OrganizationTableData = z.infer<typeof organizationTableDataSchema>;

/**
 * Subscription analytics type (inferred from schema).
 */
export type SubscriptionAnalytics = z.infer<typeof subscriptionAnalyticsSchema>;
