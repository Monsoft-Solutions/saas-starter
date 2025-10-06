/**
 * Unit tests for super-admin-middleware.ts
 * Tests server action wrapper with super-admin authorization.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionState } from '@/lib/auth/middleware';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Use vi.hoisted to ensure variables are available in mocks
const { redirectMock, currentHeadersRef, headersMock, getSession, loggerMock } =
  vi.hoisted(() => {
    const redirectMock = vi.fn();
    const currentHeadersRef = { current: new Headers() };
    const headersMock = vi.fn(async () => currentHeadersRef.current);
    const getSession = vi.fn();
    const loggerMock = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    return {
      redirectMock,
      currentHeadersRef,
      headersMock,
      getSession,
      loggerMock,
    };
  });

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('next/headers', () => ({
  headers: headersMock,
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  default: loggerMock,
}));

vi.mock('@/lib/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

// Import after mocks
import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import type { SuperAdminContext } from '@/lib/auth/super-admin-context';

let testCounter = 0;

beforeEach(() => {
  testCounter++;
  // Create unique headers for each test to avoid cache hits
  currentHeadersRef.current = new Headers([['x-test-id', String(testCounter)]]);
  vi.clearAllMocks();
});

describe('withSuperAdmin - stateless actions (single FormData argument)', () => {
  it('should execute action for admin user and return result', async () => {
    const sessionPayload = {
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(
      async (_formData: FormData, _context: SuperAdminContext) => {
        return { success: 'Action completed' };
      }
    );

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();
    formData.append('test', 'value');

    const result = await wrappedAction(formData);

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(mockAction).toHaveBeenCalledWith(formData, expect.any(Object));
    expect(result).toEqual({ success: 'Action completed' });
  });

  it('should execute action for super-admin user and return result', async () => {
    const sessionPayload = {
      user: {
        id: 'user_2',
        email: 'superadmin@test.com',
        name: 'Super Admin',
        image: undefined,
        role: 'super-admin',
      },
      session: { id: 'session_2' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      return { data: 'test data' };
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await wrappedAction(formData);

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: 'test data' });
  });

  it('should redirect non-admin users to /app', async () => {
    const sessionPayload = {
      user: {
        id: 'user_3',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_3' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn();
    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    await wrappedAction(formData);

    expect(mockAction).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/app');
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('should pass SuperAdminContext to action with correct role', async () => {
    const sessionPayload = {
      user: {
        id: 'user_4',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_4' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(
      async (_formData: FormData, context: SuperAdminContext) => {
        return { userId: context.user.id, role: context.user.role };
      }
    );

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await wrappedAction(formData);

    expect(result).toEqual({ userId: 'user_4', role: 'admin' });
    expect(mockAction).toHaveBeenCalledWith(
      formData,
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'user_4',
          role: 'admin',
        }),
      })
    );
  });

  it('should handle action throwing non-SuperAdminRequiredError', async () => {
    const sessionPayload = {
      user: {
        id: 'user_5',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_5' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const testError = new Error('Action failed');
    const mockAction = vi.fn(async () => {
      throw testError;
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    await expect(wrappedAction(formData)).rejects.toThrow('Action failed');
    expect(loggerMock.error).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe('withSuperAdmin - stateful actions (prevState + FormData arguments)', () => {
  it('should execute action and return result as ActionState', async () => {
    const sessionPayload = {
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      return { success: 'Stateful action completed' };
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = {};
    const formData = new FormData();

    const result = await wrappedAction(prevState, formData);

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: 'Stateful action completed' });
  });

  it('should redirect non-admin users to /app in stateful call', async () => {
    const sessionPayload = {
      user: {
        id: 'user_2',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_2' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn();
    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = {};
    const formData = new FormData();

    await wrappedAction(prevState, formData);

    expect(mockAction).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/app');
  });

  it('should return ActionState with error when action throws', async () => {
    const sessionPayload = {
      user: {
        id: 'user_3',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_3' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const testError = new Error('Action failed');
    const mockAction = vi.fn(async () => {
      throw testError;
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = { someField: 'preserved' };
    const formData = new FormData();

    const result = await wrappedAction(prevState, formData);

    expect(result).toEqual({
      someField: 'preserved',
      error: 'Action failed',
    });
    expect(loggerMock.error).toHaveBeenCalled();
  });

  it('should preserve previous state fields when error occurs', async () => {
    const sessionPayload = {
      user: {
        id: 'user_4',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_4' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      throw new Error('Validation error');
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = {
      formDataJson: JSON.stringify({ name: 'Test' }),
      attemptCount: 3,
    };
    const formData = new FormData();

    const result = await wrappedAction(prevState, formData);

    expect(result).toEqual({
      formDataJson: JSON.stringify({ name: 'Test' }),
      attemptCount: 3,
      error: 'Validation error',
    });
  });

  it('should handle non-Error thrown objects', async () => {
    const sessionPayload = {
      user: {
        id: 'user_5',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_5' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'String error';
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = {};
    const formData = new FormData();

    const result = await wrappedAction(prevState, formData);

    expect(result).toEqual({
      error: 'Action failed',
    });
  });

  it('should handle action returning undefined', async () => {
    const sessionPayload = {
      user: {
        id: 'user_6',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_6' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      return undefined;
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const prevState: ActionState = {};
    const formData = new FormData();

    const result = await wrappedAction(prevState, formData);

    expect(result).toEqual({});
  });
});

describe('withSuperAdmin - context passing', () => {
  it('should pass FormData unchanged to action', async () => {
    const sessionPayload = {
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(
      async (formData: FormData, _context: SuperAdminContext) => {
        return {
          receivedData: {
            field1: formData.get('field1'),
            field2: formData.get('field2'),
          },
        };
      }
    );

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();
    formData.append('field1', 'value1');
    formData.append('field2', 'value2');

    const result = await wrappedAction(formData);

    expect(result).toEqual({
      receivedData: {
        field1: 'value1',
        field2: 'value2',
      },
    });
  });

  it('should provide complete SuperAdminContext to action', async () => {
    const sessionPayload = {
      user: {
        id: 'user_2',
        email: 'admin@test.com',
        name: 'Admin User',
        image: 'https://example.com/avatar.png',
        emailVerified: true,
        role: 'super-admin',
      },
      session: {
        id: 'session_2',
        expiresAt: new Date('2025-12-31'),
      },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(
      async (_formData: FormData, context: SuperAdminContext) => {
        expect(context.user.id).toBe('user_2');
        expect(context.user.email).toBe('admin@test.com');
        expect(context.user.role).toBe('super-admin');
        expect(context.user.image).toBe('https://example.com/avatar.png');
        return { success: true };
      }
    );

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    await wrappedAction(formData);

    expect(mockAction).toHaveBeenCalledWith(formData, expect.any(Object));
  });
});

describe('withSuperAdmin - logging', () => {
  it('should log error when SuperAdminRequiredError occurs', async () => {
    const sessionPayload = {
      user: {
        id: 'user_1',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_1' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn();
    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    await wrappedAction(formData);

    expect(loggerMock.error).toHaveBeenCalledWith(
      '[withSuperAdmin] Action failed',
      expect.objectContaining({
        error: expect.any(Error),
      })
    );
  });

  it('should log error when action throws', async () => {
    const sessionPayload = {
      user: {
        id: 'user_2',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_2' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const testError = new Error('Test error');
    const mockAction = vi.fn(async () => {
      throw testError;
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    await expect(wrappedAction(formData)).rejects.toThrow('Test error');

    expect(loggerMock.error).toHaveBeenCalledWith(
      '[withSuperAdmin] Action failed',
      expect.objectContaining({
        error: testError,
      })
    );
  });
});

describe('withSuperAdmin - edge cases', () => {
  it('should handle action returning null', async () => {
    const sessionPayload = {
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async () => {
      return null;
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await wrappedAction(formData);

    expect(result).toBeNull();
  });

  it('should handle synchronous action', async () => {
    const sessionPayload = {
      user: {
        id: 'user_2',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_2' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    // eslint-disable-next-line @typescript-eslint/require-await
    const mockAction = vi.fn(
      async (_formData: FormData, _context: SuperAdminContext) => {
        return { synchronous: true };
      }
    );

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await wrappedAction(formData);

    expect(result).toEqual({ synchronous: true });
  });

  it('should handle empty FormData', async () => {
    const sessionPayload = {
      user: {
        id: 'user_3',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_3' },
    };

    getSession.mockResolvedValueOnce(sessionPayload);

    const mockAction = vi.fn(async (formData: FormData) => {
      return { isEmpty: Array.from(formData.entries()).length === 0 };
    });

    const wrappedAction = withSuperAdmin(mockAction);
    const formData = new FormData();

    const result = await wrappedAction(formData);

    expect(result).toEqual({ isEmpty: true });
  });
});
