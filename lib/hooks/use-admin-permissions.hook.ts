'use client';

import { useMemo } from 'react';
import { useAdminAccess } from '@/components/admin/shared/admin-access.provider';
import type { AdminPermission } from '@/lib/types/admin/permission.enum';

/**
 * Hook to check if the current admin has a specific permission.
 *
 * @param permission - The permission to check
 * @returns {boolean} True if the admin has the permission
 *
 * @example
 * ```tsx
 * const canEdit = useHasPermission('users:write');
 *
 * return (
 *   <Button disabled={!canEdit}>
 *     Edit User
 *   </Button>
 * );
 * ```
 */
export function useHasPermission(permission: AdminPermission): boolean {
  const { permissions } = useAdminAccess();

  return useMemo(() => {
    return permissions.includes(permission);
  }, [permissions, permission]);
}

/**
 * Hook to check if the current admin has any of the specified permissions.
 * Useful for showing UI elements that require one of several permissions.
 *
 * @param permissionList - Array of permissions to check
 * @returns {boolean} True if the admin has at least one of the permissions
 *
 * @example
 * ```tsx
 * const canAccessUsers = useHasAnyPermission(['users:read', 'users:write']);
 *
 * if (!canAccessUsers) {
 *   return <AccessDenied />;
 * }
 * ```
 */
export function useHasAnyPermission(
  permissionList: AdminPermission[]
): boolean {
  const { permissions } = useAdminAccess();

  return useMemo(() => {
    return permissionList.some((permission) =>
      permissions.includes(permission)
    );
  }, [permissions, permissionList]);
}

/**
 * Hook to check if the current admin has all of the specified permissions.
 * Useful for actions that require multiple permissions.
 *
 * @param permissionList - Array of permissions to check
 * @returns {boolean} True if the admin has all of the permissions
 *
 * @example
 * ```tsx
 * const canFullyManageUsers = useHasAllPermissions(['users:read', 'users:write']);
 * ```
 */
export function useHasAllPermissions(
  permissionList: AdminPermission[]
): boolean {
  const { permissions } = useAdminAccess();

  return useMemo(() => {
    return permissionList.every((permission) =>
      permissions.includes(permission)
    );
  }, [permissions, permissionList]);
}
