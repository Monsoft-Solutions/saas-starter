import { beforeEach, describe, expect, it, vi } from 'vitest';

type SelectStep =
  | 'from'
  | 'where'
  | 'orderBy'
  | 'limit'
  | 'offset'
  | 'innerJoin';

function buildSelectChain(steps: SelectStep[], result: unknown) {
  if (steps.length === 0 || steps[0] !== 'from') {
    throw new Error('Select chain must start with "from"');
  }

  const root: Record<string, unknown> = {};
  let current = root;

  steps.forEach((step, index) => {
    const isLast = index === steps.length - 1;

    if (isLast) {
      current[step] = vi.fn(async () => result);
    } else {
      const next: Record<string, unknown> = {};
      current[step] = vi.fn(() => next);
      current = next;
    }
  });

  return root;
}

const mocks = vi.hoisted(() => {
  const selectQueue: Array<Record<string, unknown>> = [];

  const selectMock = vi.fn(() => {
    const next = selectQueue.shift();
    if (!next) {
      throw new Error('Unexpected db.select call');
    }
    return next;
  });

  const queueSelectChains = (...chains: Array<Record<string, unknown>>) => {
    selectQueue.push(...chains);
  };

  const insertMock = vi.fn();

  const updateSetCalls: unknown[] = [];
  const updateMock = vi.fn(() => ({
    set: vi.fn((values: unknown) => {
      updateSetCalls.push(values);
      return {
        where: vi.fn(async () => ({})),
      };
    }),
  }));

  const resetDbMocks = () => {
    selectQueue.length = 0;
    selectMock.mockClear();
    insertMock.mockClear();
    updateMock.mockClear();
    updateSetCalls.length = 0;
  };

  const cacheGetOrSet = vi.fn(async (_key, factory: () => unknown, _opts) => {
    return factory();
  });
  const cacheDelete = vi.fn(async () => undefined);
  const cacheInvalidatePattern = vi.fn(async () => undefined);

  const cacheService = {
    getOrSet: cacheGetOrSet,
    delete: cacheDelete,
    invalidatePattern: cacheInvalidatePattern,
  };

  const resetCache = () => {
    cacheGetOrSet.mockClear();
    cacheDelete.mockClear();
    cacheInvalidatePattern.mockClear();
  };

  const loggerMock = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };

  return {
    selectMock,
    insertMock,
    updateMock,
    queueSelectChains,
    resetDbMocks,
    cacheService,
    cacheGetOrSet,
    cacheDelete,
    cacheInvalidatePattern,
    resetCache,
    loggerMock,
    updateSetCalls,
  };
});

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: mocks.selectMock,
    update: mocks.updateMock,
    insert: mocks.insertMock,
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheService: mocks.cacheService,
  CacheKeys: {
    custom: (_namespace: string, key: string) => `admin:${key}`,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  default: mocks.loggerMock,
}));

import {
  banUserById,
  getUserStatistics,
  getUserWithDetails,
  listAllUsers,
  unbanUserById,
  updateUserRole,
} from '@/lib/db/queries/admin-user.query';

describe('admin user queries', () => {
  beforeEach(() => {
    mocks.resetDbMocks();
    mocks.resetCache();
    vi.clearAllMocks();
  });

  it('lists users with filters and caching', async () => {
    const filters = {
      search: 'admin',
      role: 'admin',
      banned: false,
      emailVerified: true,
      limit: 2,
      offset: 0,
    };

    const userRows = [
      {
        id: 'user_1',
        name: 'Admin User',
        email: 'admin@test.com',
        emailVerified: true,
        image: null,
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-02T00:00:00Z'),
        role: 'admin',
        banned: false,
        banReason: null,
        banExpires: null,
      },
      {
        id: 'user_2',
        name: 'Super Admin',
        email: 'super@test.com',
        emailVerified: true,
        image: null,
        createdAt: new Date('2025-09-28T00:00:00Z'),
        updatedAt: new Date('2025-09-29T00:00:00Z'),
        role: 'super-admin',
        banned: false,
        banReason: null,
        banExpires: null,
      },
    ];

    mocks.queueSelectChains(
      buildSelectChain(
        ['from', 'where', 'orderBy', 'limit', 'offset'],
        userRows
      ),
      buildSelectChain(['from', 'where'], [{ count: 4 }])
    );

    const result = await listAllUsers(filters);

    expect(result).toMatchObject({
      data: expect.arrayContaining(userRows),
      total: 4,
      limit: 2,
      offset: 0,
      hasMore: true,
    });
    expect(result.hasMore).toBe(true);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      expect.stringContaining('admin:users-list'),
      expect.any(Function),
      expect.objectContaining({ ttl: 60 })
    );
  });

  it('returns detailed user profile with organizations and activity', async () => {
    const userId = 'user_42';

    const userRecord = [
      {
        id: userId,
        email: 'user42@test.com',
        name: 'Forty Two',
        role: 'admin',
      },
    ];

    const organizations = [
      {
        organizationId: 'org_1',
        name: 'Org One',
        slug: 'org-one',
        role: 'owner',
        joinedAt: new Date('2025-01-01T00:00:00Z'),
        stripeCustomerId: 'cust_1',
        subscriptionStatus: 'active',
        planName: 'Pro',
      },
    ];

    const recentActivity = [
      {
        id: 'act_1',
        action: 'login',
        timestamp: new Date('2025-10-02T10:00:00Z'),
        ipAddress: '10.0.0.1',
      },
    ];

    mocks.queueSelectChains(
      buildSelectChain(['from', 'where', 'limit'], userRecord),
      buildSelectChain(
        ['from', 'innerJoin', 'where', 'orderBy'],
        organizations
      ),
      buildSelectChain(['from', 'where', 'orderBy', 'limit'], recentActivity)
    );

    const result = await getUserWithDetails(userId);

    expect(result).toMatchObject({
      id: userId,
      organizations,
      recentActivity,
      organizationCount: 1,
    });
  });

  it('updates user role and invalidates caches', async () => {
    await updateUserRole('user_admin', 'super-admin');

    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetCalls[0]).toEqual({ role: 'super-admin' });
    expect(mocks.cacheDelete).toHaveBeenCalledWith(
      'admin:user-details-user_admin'
    );
    expect(mocks.cacheInvalidatePattern).toHaveBeenCalledWith(
      'admin:users-list-*'
    );
    expect(mocks.loggerMock.info).toHaveBeenCalledWith(
      '[admin-user] User role updated',
      { userId: 'user_admin', newRole: 'super-admin' }
    );
  });

  it('bans a user and invalidates user list cache', async () => {
    await banUserById('user_ban', 'Violation of terms', 7);

    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetCalls[0]).toMatchObject({
      banned: true,
      banReason: 'Violation of terms',
    });
    expect(mocks.cacheDelete).toHaveBeenCalledWith(
      'admin:user-details-user_ban'
    );
    expect(mocks.cacheInvalidatePattern).toHaveBeenCalledWith(
      'admin:users-list-*'
    );
    expect(mocks.loggerMock.info).toHaveBeenCalledWith(
      '[admin-user] User banned',
      expect.objectContaining({ userId: 'user_ban', expiresInDays: 7 })
    );
  });

  it('unbans a user and clears cached profile', async () => {
    await unbanUserById('user_unban');

    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateSetCalls[0]).toMatchObject({
      banned: false,
      banReason: null,
      banExpires: null,
    });
    expect(mocks.cacheDelete).toHaveBeenCalledWith(
      'admin:user-details-user_unban'
    );
    expect(mocks.cacheInvalidatePattern).toHaveBeenCalledWith(
      'admin:users-list-*'
    );
    expect(mocks.loggerMock.info).toHaveBeenCalledWith(
      '[admin-user] User unbanned',
      { userId: 'user_unban' }
    );
  });

  it('aggregates user statistics with caching', async () => {
    const statsRow = {
      totalUsers: 10,
      verifiedUsers: 8,
      bannedUsers: 1,
      adminUsers: 2,
    };

    mocks.queueSelectChains(buildSelectChain(['from'], [statsRow]));

    const stats = await getUserStatistics();

    expect(stats).toEqual(statsRow);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      'admin:user-statistics',
      expect.any(Function),
      expect.objectContaining({ ttl: 300 })
    );
  });
});
