import { z } from 'zod';

/**
 * Schema for organization subscription API response
 */
export const organizationSubscriptionResponseSchema = z.object({
  organizationId: z.string().nullable(),
  organizationName: z.string().nullable(),
  stripeProductId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  planName: z.string().nullable(),
  subscriptionStatus: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
});

/**
 * Schema for API error response
 */
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

/**
 * Type for organization subscription API response
 */
export type OrganizationSubscriptionResponse = z.infer<
  typeof organizationSubscriptionResponseSchema
>;

/**
 * Type for API error response
 */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Union type for all possible API responses
 */
export type SubscriptionApiResponse =
  | OrganizationSubscriptionResponse
  | ApiErrorResponse;
