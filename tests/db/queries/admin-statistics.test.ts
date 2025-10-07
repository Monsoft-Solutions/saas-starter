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

  const insertResultRef: { value: unknown[] } = { value: [] };
  const insertValuesCalls: unknown[] = [];

  const insertMock = vi.fn(() => ({
    values: vi.fn((values: unknown) => {
      insertValuesCalls.push(values);
      return {
        returning: vi.fn(async () => insertResultRef.value),
      };
    }),
  }));

  const updateSetCalls: unknown[] = [];
  const updateMock = vi.fn(() => ({
    set: vi.fn((values: unknown) => {
      updateSetCalls.push(values);
      return {
        where: vi.fn(async () => ({})),
      };
    }),
  }));

  const setInsertResult = (rows: unknown[]) => {
    insertResultRef.value = rows;
  };

  const resetDbMocks = () => {
    selectQueue.length = 0;
    selectMock.mockClear();
    insertMock.mockClear();
    insertValuesCalls.length = 0;
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
    setInsertResult,
    resetDbMocks,
    cacheService,
    cacheGetOrSet,
    cacheDelete,
    cacheInvalidatePattern,
    resetCache,
    loggerMock,
    insertValuesCalls,
    updateSetCalls,
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
  calculateAdminStatistics,
  getAdminStatistics,
  getHistoricalStatistics,
  refreshAdminStatistics,
} from '@/lib/db/queries/admin-statistics.query';

describe('admin statistics queries', () => {
  beforeEach(() => {
    mocks.resetDbMocks();
    mocks.resetCache();
    vi.clearAllMocks();
  });

  it('calculates admin statistics with accurate aggregates', async () => {
    mocks.queueSelectChains(
      buildSelectChain(['from'], [{ count: 50 }]),
      buildSelectChain(['from', 'where'], [{ count: 20 }]),
      buildSelectChain(['from', 'where'], [{ count: 10 }]),
      buildSelectChain(['from'], [{ count: 12 }]),
      buildSelectChain(['from', 'where'], [{ count: 8 }]),
      buildSelectChain(['from', 'where'], [{ total: 8, mrr: 250 }]),
      buildSelectChain(['from', 'where'], [{ count: 3 }]),
      buildSelectChain(['from', 'where'], [{ count: 5 }])
    );

    const stats = await calculateAdminStatistics();

    expect(stats).toMatchObject({
      totalUsers: 50,
      activeUsersLast30Days: 20,
      newUsersLast30Days: 10,
      totalOrganizations: 12,
      organizationsWithSubscriptions: 8,
      totalMRR: 250,
      totalActiveSubscriptions: 8,
      trialOrganizations: 3,
      userGrowthRate: 100,
      revenueGrowthRate: null,
      churnRate: null,
    });
    expect(stats.calculatedAt).toBeInstanceOf(Date);
    expect(stats.calculationDurationMs).toBeGreaterThanOrEqual(0);
    expect(mocks.loggerMock.error).not.toHaveBeenCalled();
  });

  it('refreshes admin statistics and invalidates cache', async () => {
    const calculatedRow = {
      totalUsers: 25,
      activeUsersLast30Days: 12,
      newUsersLast30Days: 6,
      totalOrganizations: 7,
      organizationsWithSubscriptions: 4,
      totalMRR: 125,
      totalActiveSubscriptions: 4,
      trialOrganizations: 2,
      userGrowthRate: 50,
      revenueGrowthRate: null,
      churnRate: null,
      calculationDurationMs: 10,
      calculatedAt: new Date('2025-10-01T00:00:00Z'),
    };

    mocks.queueSelectChains(
      buildSelectChain(['from'], [{ count: calculatedRow.totalUsers }]),
      buildSelectChain(
        ['from', 'where'],
        [{ count: calculatedRow.activeUsersLast30Days }]
      ),
      buildSelectChain(
        ['from', 'where'],
        [{ count: calculatedRow.newUsersLast30Days }]
      ),
      buildSelectChain(['from'], [{ count: calculatedRow.totalOrganizations }]),
      buildSelectChain(
        ['from', 'where'],
        [{ count: calculatedRow.organizationsWithSubscriptions }]
      ),
      buildSelectChain(
        ['from', 'where'],
        [
          {
            total: calculatedRow.totalActiveSubscriptions,
            mrr: calculatedRow.totalMRR,
          },
        ]
      ),
      buildSelectChain(
        ['from', 'where'],
        [{ count: calculatedRow.trialOrganizations }]
      ),
      buildSelectChain(['from', 'where'], [{ count: 6 }])
    );

    mocks.setInsertResult([{ id: 'stat_1', ...calculatedRow }]);

    const result = await refreshAdminStatistics();

    expect(result).toMatchObject({ id: 'stat_1', totalUsers: 25 });
    expect(mocks.insertMock).toHaveBeenCalledTimes(1);
    expect(mocks.cacheDelete).toHaveBeenCalledWith('admin:latest-statistics');
    expect(mocks.loggerMock.info).toHaveBeenCalledWith(
      '[admin-stats] Statistics refreshed',
      expect.objectContaining({
        totalUsers: 25,
        totalOrganizations: 7,
        totalMRR: 125,
      })
    );
  });

  it('reads admin statistics through cache layer', async () => {
    const latestRow = { id: 'stat_latest', totalUsers: 99 };

    mocks.queueSelectChains(
      buildSelectChain(['from', 'orderBy', 'limit'], [latestRow])
    );

    const stats = await getAdminStatistics();

    expect(stats).toEqual(latestRow);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      'admin:latest-statistics',
      expect.any(Function),
      expect.objectContaining({ ttl: 300 })
    );
  });

  it('fetches historical statistics with caching', async () => {
    const historicalRows = [
      { id: 'stat_a', calculatedAt: new Date('2025-09-30T00:00:00Z') },
      { id: 'stat_b', calculatedAt: new Date('2025-10-01T00:00:00Z') },
    ];

    mocks.queueSelectChains(
      buildSelectChain(['from', 'where', 'orderBy', 'limit'], historicalRows)
    );

    const rows = await getHistoricalStatistics(7);

    expect(rows).toEqual(historicalRows);
    expect(mocks.cacheGetOrSet).toHaveBeenCalledWith(
      'admin:historical-statistics-7',
      expect.any(Function),
      expect.objectContaining({ ttl: 600 })
    );
  });
});
