import { z } from 'zod';
import { searchablePaginationRequestSchema } from '@/lib/types/common/pagination-request.schema';

/**
 * Query parameter schema for GET /api/admin/organizations endpoint.
 *
 * Supports filtering by:
 * - search: Filter by organization name
 * - subscriptionStatus: Filter by subscription status (active, trialing, etc.)
 * - hasSubscription: Filter by subscription presence (true/false)
 * - analytics: Include subscription analytics in response
 * - limit/offset: Pagination
 */
export const adminOrganizationListRequestSchema =
  searchablePaginationRequestSchema.extend({
    /**
     * Filter by subscription status.
     * Matches Stripe subscription status values.
     */
    subscriptionStatus: z
      .enum([
        'active',
        'trialing',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused',
      ])
      .optional()
      .transform((val) => val ?? undefined),

    /**
     * Filter by subscription presence.
     * - 'true': Only organizations with subscriptions
     * - 'false': Only organizations without subscriptions
     */
    hasSubscription: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) =>
        val === 'true' ? true : val === 'false' ? false : undefined
      ),

    /**
     * Include subscription analytics in the response.
     * When true, adds aggregated subscription metrics.
     */
    analytics: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
  });

/**
 * Admin organization list request type (inferred from schema).
 */
export type AdminOrganizationListRequest = z.infer<
  typeof adminOrganizationListRequestSchema
>;
