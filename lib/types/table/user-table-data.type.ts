/**
 * User table data type.
 * Represents a single user row in the admin users table.
 *
 * Re-exported from admin schema for single source of truth.
 * @see lib/types/admin/admin-user-list-response.schema.ts
 */
export type { UserTableData } from '@/lib/types/admin/admin-user-list-response.schema';

/**
 * User table filters type.
 * Defines available filter options for the admin users table.
 *
 * Re-exported from admin schema for single source of truth.
 * @see lib/types/admin/admin-user-list-request.schema.ts
 */
export type { AdminUserListRequest as UserTableFilters } from '@/lib/types/admin/admin-user-list-request.schema';
