/**
 * Admin context helpers that derive permission-aware access metadata from the server context.
 */
import 'server-only';

import type { ServerContext } from './server-context';
import {
  getServerContext,
  getServerContextFromHeaders,
} from './server-context';
import { getRolePermissions, hasPermission } from './permissions';
import type {
  AdminPermission,
  AdminPermissionSet,
} from '@/lib/types/admin/permission.enum';
import { USER_ROLES, type UserRole } from '@/lib/types/admin/user-role.enum';

export type AdminRole = Extract<UserRole, 'admin' | 'super-admin'>;

export type AdminPermissionFlags = {
  canViewActivity: boolean;
  canViewAnalytics: boolean;
  canManageAnalytics: boolean;
  canViewOrganizations: boolean;
  canEditOrganizations: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
};

export type AdminAuthorization = {
  role: AdminRole;
  permissions: AdminPermissionSet;
  isSuperAdmin: boolean;
} & AdminPermissionFlags;

export type AdminContext = ServerContext & {
  user: ServerContext['user'] & { role: AdminRole };
  admin: AdminAuthorization;
};

export class AdminAccessRequiredError extends Error {
  constructor(message = 'Admin access required') {
    super(message);
    this.name = 'AdminAccessRequiredError';
  }
}

const ADMIN_ROLES = new Set<AdminRole>(['admin', 'super-admin']);

function resolveRole(candidate: unknown): AdminRole | null {
  if (typeof candidate !== 'string') {
    return null;
  }

  if (!USER_ROLES.includes(candidate as UserRole)) {
    return null;
  }

  return ADMIN_ROLES.has(candidate as AdminRole)
    ? (candidate as AdminRole)
    : null;
}

function buildPermissionFlags(
  permissions: AdminPermissionSet
): AdminPermissionFlags {
  return {
    canViewActivity: hasPermission(permissions, 'activity:read'),
    canViewAnalytics: hasPermission(permissions, 'analytics:read'),
    canManageAnalytics: hasPermission(permissions, 'analytics:write'),
    canViewOrganizations: hasPermission(permissions, 'organizations:read'),
    canEditOrganizations: hasPermission(permissions, 'organizations:write'),
    canViewUsers: hasPermission(permissions, 'users:read'),
    canEditUsers: hasPermission(permissions, 'users:write'),
  } satisfies AdminPermissionFlags;
}

function enrichContext(base: ServerContext, role: AdminRole): AdminContext {
  const permissions = getRolePermissions(role);
  const flags = buildPermissionFlags(permissions);

  return {
    ...base,
    user: {
      ...base.user,
      role,
    },
    admin: {
      role,
      permissions,
      isSuperAdmin: role === 'super-admin',
      ...flags,
    },
  } satisfies AdminContext;
}

function resolveAdminContext(base: ServerContext | null): AdminContext | null {
  if (!base) {
    return null;
  }

  const role = resolveRole((base.user as { role?: unknown }).role);

  if (!role) {
    return null;
  }

  return enrichContext(base, role);
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const base = await getServerContext();
  return resolveAdminContext(base);
}

export async function getAdminContextFromHeaders(
  requestHeaders: Headers
): Promise<AdminContext | null> {
  const base = await getServerContextFromHeaders(requestHeaders);
  return resolveAdminContext(base);
}

export async function requireAdminContext(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) {
    throw new AdminAccessRequiredError();
  }

  return context;
}

export async function requireAdminContextFromHeaders(
  requestHeaders: Headers
): Promise<AdminContext> {
  const context = await getAdminContextFromHeaders(requestHeaders);
  if (!context) {
    throw new AdminAccessRequiredError();
  }

  return context;
}

export function hasAdminPermission(
  context: AdminContext,
  permission: AdminPermission
): boolean {
  return hasPermission(context.admin.permissions, permission);
}
