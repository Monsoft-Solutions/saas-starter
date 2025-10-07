/**
 * Super admin context helpers for role-based access control.
 * Uses Better Auth admin plugin for role verification.
 */
import 'server-only';

import type { AdminContext } from './admin-context';
import {
  AdminAccessRequiredError,
  getAdminContext,
  getAdminContextFromHeaders,
} from './admin-context';

export type SuperAdminContext = AdminContext & {
  user: AdminContext['user'] & { role: 'super-admin' };
  admin: AdminContext['admin'] & { role: 'super-admin'; isSuperAdmin: true };
};

export class SuperAdminRequiredError extends AdminAccessRequiredError {
  constructor(message = 'Super admin access required') {
    super(message);
    this.name = 'SuperAdminRequiredError';
  }
}

export function isUserAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super-admin';
}

export function isUserSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super-admin';
}

function asSuperAdminContext(
  context: AdminContext | null
): SuperAdminContext | null {
  if (!context || context.admin.role !== 'super-admin') {
    return null;
  }

  return context as SuperAdminContext;
}

export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const context = await getAdminContext();
  return asSuperAdminContext(context);
}

export async function getSuperAdminContextFromHeaders(
  requestHeaders: Headers
): Promise<SuperAdminContext | null> {
  const context = await getAdminContextFromHeaders(requestHeaders);
  return asSuperAdminContext(context);
}

export async function requireSuperAdminContext(): Promise<SuperAdminContext> {
  const context = await getSuperAdminContext();
  if (!context) {
    throw new SuperAdminRequiredError();
  }

  return context;
}

export async function requireSuperAdminContextFromHeaders(
  requestHeaders: Headers
): Promise<SuperAdminContext> {
  const context = await getSuperAdminContextFromHeaders(requestHeaders);
  if (!context) {
    throw new SuperAdminRequiredError();
  }

  return context;
}
