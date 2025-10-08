import { z } from 'zod';
import { paginationRequestSchema } from '../common/pagination-request.schema';
import { USER_ROLES_ZOD } from './user-role.enum';

export const userListFiltersSchema = paginationRequestSchema.extend({
  search: z.string().optional(),
  role: USER_ROLES_ZOD.optional(),
  banned: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

/**
 * User list filter type for admin user queries.
 * Extends pagination params with user-specific filters.
 */
export type UserListFilters = z.infer<typeof userListFiltersSchema>;
