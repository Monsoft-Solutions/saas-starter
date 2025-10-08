import { z } from 'zod';
import { searchablePaginationRequestSchema } from '@/lib/types/common/pagination-request.schema';
import { USER_ROLES } from './user-role.enum';

/**
 * Query parameter schema for GET /api/admin/users endpoint.
 *
 * Supports filtering by:
 * - search: Filter by email or name
 * - role: Filter by user role
 * - limit/offset: Pagination
 */
export const adminUserListRequestSchema =
  searchablePaginationRequestSchema.extend({
    /**
     * Filter by user role.
     * Optional - if not provided, returns users with all roles.
     */
    role: z.enum(USER_ROLES).optional(),
  });

/**
 * Admin user list request type (inferred from schema).
 */
export type AdminUserListRequest = z.infer<typeof adminUserListRequestSchema>;
