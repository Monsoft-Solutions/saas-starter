import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { getServerContextMock, getServerContextFromHeadersMock } = vi.hoisted(
  () => {
    const getServerContextMock = vi.fn();
    const getServerContextFromHeadersMock = vi.fn();

    return {
      getServerContextMock,
      getServerContextFromHeadersMock,
    };
  }
);

vi.mock('@/lib/auth/server-context', () => ({
  getServerContext: getServerContextMock,
  getServerContextFromHeaders: getServerContextFromHeadersMock,
}));

import {
  AdminAccessRequiredError,
  getAdminContext,
  getAdminContextFromHeaders,
  hasAdminPermission,
  requireAdminContext,
} from '@/lib/auth/admin-context';
import type { AdminContext } from '@/lib/auth/admin-context';
import type { ServerContext } from '@/lib/auth/server-context';

function buildServerContext(role: string | null): ServerContext {
  const sessionUser = {
    id: 'user',
    email: 'user@example.com',
    name: 'User',
    image: null,
    role,
  } satisfies ServerContext['user'];

  const session = {
    user: sessionUser,
    session: {},
  } satisfies ServerContext['session'];

  return {
    headers: new Headers(),
    session,
    user: sessionUser,
    organization: null,
  } satisfies ServerContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getAdminContext', () => {
  it('returns null when no session context is available', async () => {
    getServerContextMock.mockResolvedValueOnce(null);

    const result = await getAdminContext();

    expect(result).toBeNull();
  });

  it('returns null when user role is not admin', async () => {
    getServerContextMock.mockResolvedValueOnce(buildServerContext('user'));

    const result = await getAdminContext();

    expect(result).toBeNull();
  });

  it('hydrates permission flags for admin role', async () => {
    getServerContextMock.mockResolvedValueOnce(buildServerContext('admin'));

    const result = (await getAdminContext()) as AdminContext;

    expect(result.admin.role).toBe('admin');
    expect(result.admin.isSuperAdmin).toBe(false);
    expect(result.admin.canViewUsers).toBe(true);
    expect(result.admin.canEditUsers).toBe(false);
    expect(result.admin.canViewAnalytics).toBe(true);
    expect(result.admin.permissions.has('users:read')).toBe(true);
  });

  it('returns super admin context with full permissions', async () => {
    getServerContextMock.mockResolvedValueOnce(
      buildServerContext('super-admin')
    );

    const result = (await getAdminContext()) as AdminContext;

    expect(result.admin.role).toBe('super-admin');
    expect(result.admin.isSuperAdmin).toBe(true);
    expect(result.admin.canEditUsers).toBe(true);
    expect(result.admin.permissions.has('users:write')).toBe(true);
    expect(result.admin.permissions.has('analytics:write')).toBe(true);
  });
});

describe('requireAdminContext', () => {
  it('throws when admin context cannot be resolved', async () => {
    getServerContextMock.mockResolvedValueOnce(buildServerContext('user'));

    await expect(requireAdminContext()).rejects.toBeInstanceOf(
      AdminAccessRequiredError
    );
  });
});

describe('getAdminContextFromHeaders', () => {
  it('delegates to server context helper with headers', async () => {
    const headers = new Headers();
    getServerContextFromHeadersMock.mockResolvedValueOnce(
      buildServerContext('admin')
    );

    const context = await getAdminContextFromHeaders(headers);

    expect(getServerContextFromHeadersMock).toHaveBeenCalledWith(headers);
    expect(context?.admin.canViewUsers).toBe(true);
  });
});

describe('hasAdminPermission', () => {
  it('evaluates membership against the admin permission set', async () => {
    getServerContextMock.mockResolvedValueOnce(buildServerContext('admin'));
    const context = (await getAdminContext()) as AdminContext;

    expect(hasAdminPermission(context, 'users:read')).toBe(true);
    expect(hasAdminPermission(context, 'users:write')).toBe(false);
  });
});
