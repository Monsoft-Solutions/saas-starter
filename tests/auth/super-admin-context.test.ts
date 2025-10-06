/**
 * Unit tests for super-admin-context.ts
 * Tests role-based access control for super-admin functionality.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Use vi.hoisted to ensure variables are available in mocks
const { currentHeadersRef, headersMock, getSession } = vi.hoisted(() => {
  const currentHeadersRef = { current: new Headers() };
  const headersMock = vi.fn(async () => currentHeadersRef.current);
  const getSession = vi.fn();

  return { currentHeadersRef, headersMock, getSession };
});

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

vi.mock('@/lib/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

// Import after mocks
import {
  getSuperAdminContext,
  requireSuperAdminContext,
  isUserAdmin,
  isUserSuperAdmin,
  SuperAdminRequiredError,
} from '@/lib/auth/super-admin-context';

let testCounter = 0;

beforeEach(() => {
  testCounter++;
  // Create unique headers for each test to avoid cache hits
  currentHeadersRef.current = new Headers([['x-test-id', String(testCounter)]]);
  vi.clearAllMocks();
});

describe('isUserAdmin', () => {
  it('should return true for "admin" role', () => {
    expect(isUserAdmin('admin')).toBe(true);
  });

  it('should return true for "super-admin" role', () => {
    expect(isUserAdmin('super-admin')).toBe(true);
  });

  it('should return false for "user" role', () => {
    expect(isUserAdmin('user')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isUserAdmin(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isUserAdmin(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isUserAdmin('')).toBe(false);
  });

  it('should return false for invalid role', () => {
    expect(isUserAdmin('invalid-role')).toBe(false);
  });
});

describe('isUserSuperAdmin', () => {
  it('should return true for "super-admin" role', () => {
    expect(isUserSuperAdmin('super-admin')).toBe(true);
  });

  it('should return false for "admin" role', () => {
    expect(isUserSuperAdmin('admin')).toBe(false);
  });

  it('should return false for "user" role', () => {
    expect(isUserSuperAdmin('user')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isUserSuperAdmin(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isUserSuperAdmin(undefined)).toBe(false);
  });
});

describe('getSuperAdminContext', () => {
  it('should return context for user with "admin" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    });

    const context = await getSuperAdminContext();

    expect(context).not.toBeNull();
    expect(context?.user.role).toBe('admin');
    expect(context?.user.id).toBe('user_1');
    expect(context?.user.email).toBe('admin@test.com');
  });

  it('should return context for user with "super-admin" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_2',
        email: 'superadmin@test.com',
        name: 'Super Admin',
        image: undefined,
        role: 'super-admin',
      },
      session: { id: 'session_2' },
    });

    const context = await getSuperAdminContext();

    expect(context).not.toBeNull();
    expect(context?.user.role).toBe('super-admin');
    expect(context?.user.id).toBe('user_2');
    expect(context?.user.email).toBe('superadmin@test.com');
  });

  it('should return null for user with "user" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_3',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_3' },
    });

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });

  it('should return null for user without role property', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_4',
        email: 'norole@test.com',
        name: 'No Role User',
        image: undefined,
      },
      session: { id: 'session_4' },
    });

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });

  it('should return null for user with null role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_5',
        email: 'nullrole@test.com',
        name: 'Null Role User',
        image: undefined,
        role: null,
      },
      session: { id: 'session_5' },
    });

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });

  it('should return null for user with invalid role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_6',
        email: 'invalid@test.com',
        name: 'Invalid Role User',
        image: undefined,
        role: 'invalid-role',
      },
      session: { id: 'session_6' },
    });

    const context = await getSuperAdminContext();

    expect(context).toBeNull();
  });

  it('should preserve all user properties in returned context', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_7',
        email: 'admin@test.com',
        name: 'Admin User',
        image: 'https://example.com/avatar.png',
        emailVerified: true,
        createdAt: new Date('2025-01-01'),
        role: 'admin',
      },
      session: {
        id: 'session_7',
        expiresAt: new Date('2025-12-31'),
      },
    });

    const context = await getSuperAdminContext();

    expect(context).not.toBeNull();
    expect(context?.user.id).toBe('user_7');
    expect(context?.user.email).toBe('admin@test.com');
    expect(context?.user.name).toBe('Admin User');
    expect(context?.user.image).toBe('https://example.com/avatar.png');
    expect(context?.user.role).toBe('admin');
  });
});

describe('requireSuperAdminContext', () => {
  it('should return context for user with "admin" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: undefined,
        role: 'admin',
      },
      session: { id: 'session_1' },
    });

    const context = await requireSuperAdminContext();

    expect(context).toBeDefined();
    expect(context.user.role).toBe('admin');
    expect(context.user.id).toBe('user_1');
  });

  it('should return context for user with "super-admin" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_2',
        email: 'superadmin@test.com',
        name: 'Super Admin',
        image: undefined,
        role: 'super-admin',
      },
      session: { id: 'session_2' },
    });

    const context = await requireSuperAdminContext();

    expect(context).toBeDefined();
    expect(context.user.role).toBe('super-admin');
    expect(context.user.id).toBe('user_2');
  });

  it('should throw SuperAdminRequiredError for user with "user" role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_3',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_3' },
    });

    await expect(requireSuperAdminContext()).rejects.toThrow(
      SuperAdminRequiredError
    );
    await expect(requireSuperAdminContext()).rejects.toThrow(
      'Super admin access required'
    );
  });

  it('should throw SuperAdminRequiredError for user without role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_4',
        email: 'norole@test.com',
        name: 'No Role User',
        image: undefined,
      },
      session: { id: 'session_4' },
    });

    await expect(requireSuperAdminContext()).rejects.toThrow(
      SuperAdminRequiredError
    );
  });

  it('should throw SuperAdminRequiredError for user with null role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_5',
        email: 'nullrole@test.com',
        name: 'Null Role User',
        image: undefined,
        role: null,
      },
      session: { id: 'session_5' },
    });

    await expect(requireSuperAdminContext()).rejects.toThrow(
      SuperAdminRequiredError
    );
  });

  it('should throw SuperAdminRequiredError for user with invalid role', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_6',
        email: 'invalid@test.com',
        name: 'Invalid Role User',
        image: undefined,
        role: 'invalid-role',
      },
      session: { id: 'session_6' },
    });

    await expect(requireSuperAdminContext()).rejects.toThrow(
      SuperAdminRequiredError
    );
  });

  it('should include error name property in thrown error', async () => {
    getSession.mockResolvedValueOnce({
      user: {
        id: 'user_7',
        email: 'user@test.com',
        name: 'Regular User',
        image: undefined,
        role: 'user',
      },
      session: { id: 'session_7' },
    });

    try {
      await requireSuperAdminContext();
      expect.fail('Should have thrown SuperAdminRequiredError');
    } catch (error) {
      expect(error).toBeInstanceOf(SuperAdminRequiredError);
      expect((error as Error).name).toBe('SuperAdminRequiredError');
      expect((error as Error).message).toBe('Super admin access required');
    }
  });
});

describe('SuperAdminRequiredError', () => {
  it('should create error with default message', () => {
    const error = new SuperAdminRequiredError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SuperAdminRequiredError');
    expect(error.message).toBe('Super admin access required');
  });

  it('should create error with custom message', () => {
    const customMessage = 'Custom admin error message';
    const error = new SuperAdminRequiredError(customMessage);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SuperAdminRequiredError');
    expect(error.message).toBe(customMessage);
  });

  it('should be instanceof Error', () => {
    const error = new SuperAdminRequiredError();

    expect(error instanceof Error).toBe(true);
  });
});
