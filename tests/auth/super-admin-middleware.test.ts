/**
 * Unit tests for super-admin-middleware.ts
 * Ensures the wrapper enforces super-admin access semantics.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionState } from '@/lib/auth/middleware';

vi.mock('server-only', () => ({}));

const { redirectMock, loggerMock, requireSuperAdminContextMock } = vi.hoisted(
  () => {
    const redirectMock = vi.fn();
    const loggerMock = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    const requireSuperAdminContextMock = vi.fn();

    return {
      redirectMock,
      loggerMock,
      requireSuperAdminContextMock,
    };
  }
);

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/logger/logger.service', () => ({
  default: loggerMock,
}));

vi.mock('@/lib/auth/super-admin-context', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/auth/super-admin-context')
  >('@/lib/auth/super-admin-context');

  return {
    ...actual,
    requireSuperAdminContext: requireSuperAdminContextMock,
  };
});

import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import {
  SuperAdminRequiredError,
  type SuperAdminContext,
} from '@/lib/auth/super-admin-context';
import { getRolePermissions, hasPermission } from '@/lib/auth/permissions';

function buildSuperAdminContext(): SuperAdminContext {
  const permissions = getRolePermissions('super-admin');
  const sessionUser = {
    id: 'user',
    email: 'super@example.com',
    name: 'Super Admin',
    image: null,
    role: 'super-admin',
  } satisfies SuperAdminContext['user'];

  const session = {
    user: sessionUser,
    session: {},
  } satisfies SuperAdminContext['session'];

  return {
    headers: new Headers(),
    session,
    user: sessionUser,
    organization: null,
    admin: {
      role: 'super-admin',
      permissions,
      isSuperAdmin: true,
      canViewActivity: hasPermission(permissions, 'activity:read'),
      canViewAnalytics: hasPermission(permissions, 'analytics:read'),
      canManageAnalytics: hasPermission(permissions, 'analytics:write'),
      canViewOrganizations: hasPermission(permissions, 'organizations:read'),
      canEditOrganizations: hasPermission(permissions, 'organizations:write'),
      canViewUsers: hasPermission(permissions, 'users:read'),
      canEditUsers: hasPermission(permissions, 'users:write'),
    },
  } satisfies SuperAdminContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('withSuperAdmin - stateless actions', () => {
  it('executes action when super-admin context is available', async () => {
    const context = buildSuperAdminContext();
    requireSuperAdminContextMock.mockResolvedValueOnce(context);

    const actionResult = { success: 'ok' };
    const mockAction = vi.fn(async (_formData: FormData, receivedContext) => {
      expect(receivedContext).toBe(context);
      return actionResult;
    });

    const handler = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await handler(formData);

    expect(mockAction).toHaveBeenCalledWith(formData, context);
    expect(result).toEqual(actionResult);
    expect(loggerMock.error).not.toHaveBeenCalled();
  });

  it('redirects to /app when super-admin access is denied', async () => {
    requireSuperAdminContextMock.mockRejectedValueOnce(
      new SuperAdminRequiredError()
    );

    const mockAction = vi.fn();
    const handler = withSuperAdmin(mockAction);

    await handler(new FormData());

    expect(redirectMock).toHaveBeenCalledWith('/app');
    expect(mockAction).not.toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalled();
  });
});

describe('withSuperAdmin - stateful actions', () => {
  it('returns previous state with error message on failure', async () => {
    requireSuperAdminContextMock.mockResolvedValueOnce(
      buildSuperAdminContext()
    );

    const mockAction = vi.fn(async () => {
      throw new Error('boom');
    });

    const handler = withSuperAdmin(mockAction);
    const prevState: ActionState = { success: undefined };
    const formData = new FormData();

    const result = (await handler(prevState, formData)) as ActionState;

    expect(mockAction).toHaveBeenCalled();
    expect(result.error).toBe('boom');
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
