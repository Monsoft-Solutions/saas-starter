import z from 'zod';

/**
 * User role enum values (aligned with Better Auth).
 */
export const USER_ROLES = ['user', 'admin', 'super-admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLES_ZOD = z.enum(USER_ROLES);

export type UserRoleZod = z.infer<typeof USER_ROLES_ZOD>;

/**
 * Check if a role is admin or super-admin
 */
export function isAdminRole(
  role: UserRole | string | null | undefined
): boolean {
  return role === 'admin' || role === 'super-admin';
}

/**
 * Check if a role is super-admin specifically
 */
export function isSuperAdminRole(
  role: UserRole | string | null | undefined
): boolean {
  return role === 'super-admin';
}
