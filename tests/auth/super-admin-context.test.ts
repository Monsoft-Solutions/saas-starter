/**
 * Unit tests for super-admin-context.ts
 * Validates that only super-admin roles receive elevated access.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { getAdminContextMock, getAdminContextFromHeadersMock } = vi.hoisted(
  () => {
    const getAdminContextMock = vi.fn();
    const getAdminContextFromHeadersMock = vi.fn();

    return {
      getAdminContextMock,
      getAdminContextFromHeadersMock,
    };
  }
);

vi.mock('@/lib/auth/admin-context', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/auth/admin-context')
  >('@/lib/auth/admin-context');

  return {
    ...actual,
    getAdminContext: getAdminContextMock,
    getAdminContextFromHeaders: getAdminContextFromHeadersMock,
  };
});

import {
  SuperAdminRequiredError,
  getSuperAdminContext,
  getSuperAdminContextFromHeaders,
  isUserAdmin,
  isUserSuperAdmin,
  requireSuperAdminContext,
} from '@/lib/auth/super-admin-context';
import type { AdminContext } from '@/lib/auth/admin-context';
import { getRolePermissions, hasPermission } from '@/lib/auth/permissions';

function buildAdminContext(role: 'admin' | 'super-admin'): AdminContext {
  const permissions = getRolePermissions(role);
  const sessionUser = {
    id: 'user',
    email: 'user@example.com',
    name: 'User',
    image: null,
    role,
  } satisfies AdminContext['user'];

  const session = {
    user: sessionUser,
    session: {},
  } satisfies AdminContext['session'];

  return {
    headers: new Headers(),
    session,
    user: sessionUser,
    organization: null,
    admin: {
      role,
      permissions,
      isSuperAdmin: role === 'super-admin',
      canViewActivity: hasPermission(permissions, 'activity:read'),
      canViewAnalytics: hasPermission(permissions, 'analytics:read'),
      canManageAnalytics: hasPermission(permissions, 'analytics:write'),
      canViewOrganizations: hasPermission(permissions, 'organizations:read'),
      canEditOrganizations: hasPermission(permissions, 'organizations:write'),
      canViewUsers: hasPermission(permissions, 'users:read'),
      canEditUsers: hasPermission(permissions, 'users:write'),
    },
  } satisfies AdminContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('role helpers', () => {
  it('identifies admin roles correctly', () => {
    expect(isUserAdmin('admin')).toBe(true);
    expect(isUserAdmin('super-admin')).toBe(true);
    expect(isUserAdmin('user')).toBe(false);
  });

  it('identifies super-admin role correctly', () => {
    expect(isUserSuperAdmin('super-admin')).toBe(true);
    expect(isUserSuperAdmin('admin')).toBe(false);
  });
});

describe('getSuperAdminContext', () => {
  it('returns context when admin helper resolves a super-admin', async () => {
    getAdminContextMock.mockResolvedValueOnce(buildAdminContext('super-admin'));

    const context = await getSuperAdminContext();

    expect(context?.admin.role).toBe('super-admin');
    expect(context?.admin.isSuperAdmin).toBe(true);
  });

  it('returns null when admin helper resolves a regular admin', async () => {
    getAdminContextMock.mockResolvedValueOnce(buildAdminContext('admin'));

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });

  it('returns null when admin helper resolves null', async () => {
    getAdminContextMock.mockResolvedValueOnce(null);

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });
});

describe('requireSuperAdminContext', () => {
  it('throws when no super-admin context is available', async () => {
    getAdminContextMock.mockResolvedValueOnce(buildAdminContext('admin'));

    await expect(requireSuperAdminContext()).rejects.toBeInstanceOf(
      SuperAdminRequiredError
    );
  });
});

describe('getSuperAdminContextFromHeaders', () => {
  it('delegates to admin helper using request headers', async () => {
    const headers = new Headers([['x-test', '1']]);
    getAdminContextFromHeadersMock.mockResolvedValueOnce(
      buildAdminContext('super-admin')
    );

    const context = await getSuperAdminContextFromHeaders(headers);

    expect(getAdminContextFromHeadersMock).toHaveBeenCalledWith(headers);
    expect(context?.admin.isSuperAdmin).toBe(true);
  });
});
