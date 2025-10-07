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
  const updateMock = vi.fn();

  const resetDbMocks = () => {
    selectQueue.length = 0;
    selectMock.mockClear();
    insertMock.mockClear();
    updateMock.mockClear();
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
  };
});

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: mocks.selectMock,
    insert: mocks.insertMock,
    update: mocks.updateMock,
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
  getOrganizationStatistics,
  getOrganizationWithDetails,
  getSubscriptionAnalytics,
  listAllOrganizations,
} from '@/lib/db/queries/admin-organization.query';

describe('admin organization queries', () => {
  beforeEach(() => {
    mocks.resetDbMocks();
    mocks.resetCache();
    vi.clearAllMocks();
  });

  it('lists organizations with pagination and caching', async () => {
    const filters = {
      search: 'acme',
      subscriptionStatus: 'active',
      hasSubscription: true,
      limit: 5,
      offset: 0,
    };

    const organizations = [
      {
        id: 'org_1',
        name: 'Acme Inc',
        slug: 'acme-inc',
        logo: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
        stripeProductId: 'prod_1',
        planName: 'Pro',
        subscriptionStatus: 'active',
        memberCount: 3,
      },
    ];

    mocks.queueSelectChains(
      buildSelectChain(
        ['from', 'where', 'orderBy', 'limit', 'offset'],
        organizations
      ),
      buildSelectChain(['from', 'where'], [{ count: 2 }])
    );

    const result = await listAllOrganizations(filters);

    expect(result).toMatchObject({
      organizations,
      total: 2,
      limit: 5,
      offset: 0,
      hasMore: true,
    });
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      expect.stringContaining('admin:organizations-list'),
      expect.any(Function),
      expect.objectContaining({ ttl: 60 })
    );
  });

  it('returns organization details with member roster', async () => {
    const organizationId = 'org_99';

    const orgRecord = [
      {
        id: organizationId,
        name: 'Global Corp',
        slug: 'global-corp',
        planName: 'Enterprise',
      },
    ];

    const members = [
      {
        userId: 'user_1',
        role: 'owner',
        joinedAt: new Date('2025-09-01T00:00:00Z'),
        userName: 'Owner One',
        userEmail: 'owner@example.com',
        userImage: null,
        userRole: 'super-admin',
        userBanned: false,
      },
    ];

    mocks.queueSelectChains(
      buildSelectChain(['from', 'where', 'limit'], orgRecord),
      buildSelectChain(['from', 'innerJoin', 'where', 'orderBy'], members)
    );

    const result = await getOrganizationWithDetails(organizationId);

    expect(result).toMatchObject({
      id: organizationId,
      members,
      memberCount: 1,
    });
  });

  it('aggregates subscription analytics with caching', async () => {
    const analytics = {
      totalOrganizations: 10,
      withSubscriptions: 8,
      activeSubscriptions: 6,
      trialSubscriptions: 1,
      canceledSubscriptions: 1,
      pastDueSubscriptions: 0,
      basicPlan: 3,
      proPlan: 4,
      enterprisePlan: 3,
      totalMRR: 260,
    };

    mocks.queueSelectChains(buildSelectChain(['from'], [analytics]));

    const result = await getSubscriptionAnalytics();

    expect(result).toEqual(analytics);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      'admin:subscription-analytics',
      expect.any(Function),
      expect.objectContaining({ ttl: 300 })
    );
  });

  it('summarizes organization statistics with caching', async () => {
    const statsRow = {
      totalOrganizations: 10,
      withActiveSubscriptions: 6,
      withCanceledSubscriptions: 2,
      withTrialSubscriptions: 1,
      withoutSubscriptions: 3,
    };

    mocks.queueSelectChains(buildSelectChain(['from'], [statsRow]));

    const stats = await getOrganizationStatistics();

    expect(stats).toEqual(statsRow);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      'admin:organization-statistics',
      expect.any(Function),
      expect.objectContaining({ ttl: 300 })
    );
  });
});
