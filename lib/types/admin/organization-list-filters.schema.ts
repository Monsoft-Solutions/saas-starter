import { z } from 'zod';
import { paginationSchema } from '@/lib/types/notifications/pagination.type';

/**
 * Zod schema for organization list filters.
 * Extends pagination schema with organization-specific filters.
 */
export const organizationListFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  subscriptionStatus: z
    .enum([
      'active',
      'canceled',
      'trialing',
      'past_due',
      'unpaid',
      'incomplete',
    ])
    .optional(),
  hasSubscription: z.boolean().optional(),
});

export type OrganizationListFiltersInput = z.infer<
  typeof organizationListFiltersSchema
>;
