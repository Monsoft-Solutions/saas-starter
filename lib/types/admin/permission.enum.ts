/**
 * Granular admin permission identifiers.
 */
export const ADMIN_PERMISSIONS = [
  'activity:read',
  'analytics:read',
  'analytics:write',
  'organizations:read',
  'organizations:write',
  'users:read',
  'users:write',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Canonical set type used throughout the admin permission system.
 */
export type AdminPermissionSet = ReadonlySet<AdminPermission>;
