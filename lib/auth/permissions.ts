import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminPermissionSet,
} from '@/lib/types/admin/permission.enum';
import {
  ROLE_PERMISSIONS,
  FALLBACK_PERMISSIONS,
} from '@/lib/types/admin/role-permission.map';
import { USER_ROLES, type UserRole } from '@/lib/types/admin/user-role.enum';
import { logger } from '@/lib/logger';

const EMPTY_PERMISSION_SET: AdminPermissionSet = new Set();
const ROLE_PERMISSION_SET_CACHE = new Map<UserRole, AdminPermissionSet>();
const USER_ROLE_SET = new Set<UserRole>(USER_ROLES);

type PermissionSource = Iterable<AdminPermission>;

function normalizeToSet(permissions: PermissionSource): AdminPermissionSet {
  if (permissions instanceof Set) {
    return permissions as AdminPermissionSet;
  }

  const set = new Set<AdminPermission>();
  for (const permission of permissions) {
    set.add(permission);
  }

  return set as AdminPermissionSet;
}

function isKnownRole(role: string): role is UserRole {
  return USER_ROLE_SET.has(role as UserRole);
}

function buildPermissionSet(role: UserRole): AdminPermissionSet {
  const permissions = ROLE_PERMISSIONS[role] ?? FALLBACK_PERMISSIONS;
  return new Set<AdminPermission>(permissions) as AdminPermissionSet;
}

/**
 * Resolve the permission set associated with a given role.
 */
export function getRolePermissions(
  role: UserRole | string | null | undefined
): AdminPermissionSet {
  if (!role || !isKnownRole(role)) {
    return EMPTY_PERMISSION_SET;
  }

  const cached = ROLE_PERMISSION_SET_CACHE.get(role);
  if (cached) {
    return cached;
  }

  const permissionSet = buildPermissionSet(role);
  ROLE_PERMISSION_SET_CACHE.set(role, permissionSet);
  return permissionSet;
}

/**
 * Check whether the provided permissions include the required value.
 */
export function hasPermission(
  permissions: PermissionSource,
  required: AdminPermission
): boolean {
  const permissionSet = normalizeToSet(permissions);
  return permissionSet.has(required);
}

/**
 * Check whether the provided permissions include at least one of the required values.
 */
export function hasAnyPermission(
  permissions: PermissionSource,
  required: Iterable<AdminPermission>
): boolean {
  const permissionSet = normalizeToSet(permissions);
  for (const candidate of required) {
    if (permissionSet.has(candidate)) {
      return true;
    }
  }
  return false;
}

/**
 * Utility used for validating that required permissions are part of the declared catalog.
 */
export function isKnownPermission(value: string): value is AdminPermission {
  return ADMIN_PERMISSIONS.includes(value as AdminPermission);
}

/**
 * Validate permission configuration and log warnings for potential misconfigurations.
 * This helps detect when required permissions are not properly mapped to roles.
 */
export function validatePermissionConfiguration(
  requiredPermission: AdminPermission,
  role: UserRole
): void {
  if (!isKnownPermission(requiredPermission)) {
    logger.warn('Unknown permission referenced in configuration', {
      permission: requiredPermission,
      role,
      context: 'permission-validation',
    });
    return;
  }

  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions || !rolePermissions.includes(requiredPermission)) {
    logger.warn('Required permission not found in role mapping', {
      permission: requiredPermission,
      role,
      rolePermissions: rolePermissions || [],
      context: 'permission-validation',
    });
  }
}

/**
 * Enhanced permission checking with configuration validation.
 * Logs warnings when permissions are not properly configured.
 */
export function hasPermissionWithValidation(
  permissions: PermissionSource,
  required: AdminPermission,
  role?: UserRole
): boolean {
  const hasPerm = hasPermission(permissions, required);

  // Log configuration warnings if role is provided
  if (role && !hasPerm) {
    validatePermissionConfiguration(required, role);
  }

  return hasPerm;
}
