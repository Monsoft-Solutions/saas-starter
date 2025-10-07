import type { AdminPermission } from './permission.enum';
import type { AdminRole } from '@/lib/auth/admin-context';

/**
 * Client-side admin access context containing role and permission information.
 * This is derived from server-side AdminContext and passed to React components.
 */
export type AdminAccessContext = {
  role: AdminRole;
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
  canViewActivity: boolean;
  canViewAnalytics: boolean;
  canManageAnalytics: boolean;
  canViewOrganizations: boolean;
  canEditOrganizations: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
};
