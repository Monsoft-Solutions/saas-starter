import type { PaginationParams } from '@/lib/types/notifications/pagination.type';

/**
 * User list filter type for admin user queries.
 * Extends pagination params with user-specific filters.
 */
export type UserListFilters = Partial<PaginationParams> & {
  search?: string;
  role?: string;
  banned?: boolean;
  emailVerified?: boolean;
};
