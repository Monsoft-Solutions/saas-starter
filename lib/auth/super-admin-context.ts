/**
 * Super admin context helpers for role-based access control.
 * Uses Better Auth admin plugin for role verification.
 */
import 'server-only';

import { requireServerContext, type ServerContext } from './server-context';

/**
 * Super admin context with guaranteed admin role verification.
 */
export type SuperAdminContext = ServerContext & {
  user: ServerContext['user'] & {
    role: 'admin' | 'super-admin';
  };
};

/**
 * Error thrown when super-admin access is required but user doesn't have permission.
 */
export class SuperAdminRequiredError extends Error {
  constructor(message = 'Super admin access required') {
    super(message);
    this.name = 'SuperAdminRequiredError';
  }
}

/**
 * Check if user has admin role (admin or super-admin).
 */
export function isUserAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super-admin';
}

/**
 * Check if user has super-admin role specifically.
 */
export function isUserSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super-admin';
}

/**
 * Get super-admin context if user has permission, otherwise return null.
 */
export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const context = await requireServerContext();

  // Check role from user object (Better Auth populates this)
  const userRole = (context.user as { role?: string }).role;

  if (!isUserAdmin(userRole)) {
    return null;
  }

  return {
    ...context,
    user: {
      ...context.user,
      role: userRole as 'admin' | 'super-admin',
    },
  };
}

/**
 * Require super-admin context, throw error if user doesn't have permission.
 */
export async function requireSuperAdminContext(): Promise<SuperAdminContext> {
  const context = await getSuperAdminContext();

  if (!context) {
    throw new SuperAdminRequiredError();
  }

  return context;
}
