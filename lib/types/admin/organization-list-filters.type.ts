import type { PaginationParams } from '@/lib/types/notifications/pagination.type';

/**
 * Organization list filter type for admin organization queries.
 * Extends pagination params with organization-specific filters.
 */
export type OrganizationListFilters = Partial<PaginationParams> & {
  search?: string;
  subscriptionStatus?: string;
  hasSubscription?: boolean;
};
