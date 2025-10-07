import { z } from 'zod';
import { paginationSchema } from '@/lib/types/notifications/pagination.type';

/**
 * Zod schema for user list filters.
 * Extends pagination schema with user-specific filters.
 */
export const userListFiltersSchema = paginationSchema.extend({
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'super-admin']).optional(),
  banned: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

export type UserListFiltersInput = z.infer<typeof userListFiltersSchema>;
