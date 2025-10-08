'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllUsers,
  getUserWithDetails,
  searchUsers,
  getUserStatistics,
} from '@/lib/db/queries/admin-user.query';
import type { UserListFilters } from '@/lib/types/admin';

/**
 * Server action to list all users with filters and pagination.
 * Requires the `users:read` admin permission.
 */
export const listAllUsersAction = withPermission(
  'users:read',
  async (filters: UserListFilters) => {
    return await listAllUsers(filters);
  },
  'admin.users.list'
);

/**
 * Server action to get user with full details (organizations, activity).
 * Requires the `users:read` admin permission.
 */
export const getUserWithDetailsAction = withPermission(
  'users:read',
  async (userId: string) => {
    return await getUserWithDetails(userId);
  },
  'admin.users.details'
);

/**
 * Server action to search users by email or name.
 * Requires the `users:read` admin permission.
 */
export const searchUsersAction = withPermission(
  'users:read',
  async ({ query, limit = 20 }: { query: string; limit?: number }) => {
    return await searchUsers(query, limit);
  },
  'admin.users.search'
);

/**
 * Server action to get user statistics.
 * Requires the `users:read` admin permission.
 */
export const getUserStatisticsAction = withPermission(
  'users:read',
  async () => {
    return await getUserStatistics();
  },
  'admin.users.statistics'
);
