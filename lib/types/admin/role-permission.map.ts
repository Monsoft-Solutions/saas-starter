import type { AdminPermission } from './permission.enum';
import type { UserRole } from './user-role.enum';
import { ADMIN_PERMISSIONS } from './permission.enum';

export type RolePermissionMap = Record<UserRole, readonly AdminPermission[]>;

/**
 * Central role → permission mapping used by the admin guard system.
 */
export const ROLE_PERMISSIONS: RolePermissionMap = {
  user: [],
  admin: [
    'activity:read',
    'analytics:read',
    'organizations:read',
    'users:read',
  ],
  'super-admin': ADMIN_PERMISSIONS,
} as const;

/**
 * Default permission list used for unknown/unsupported roles.
 */
export const FALLBACK_PERMISSIONS: readonly AdminPermission[] = [];
