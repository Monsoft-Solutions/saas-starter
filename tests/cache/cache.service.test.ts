import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ICacheProvider } from '@/lib/cache/providers/cache.interface';
import type { CacheStats } from '@/lib/types/cache';
import { CacheKeys } from '@/lib/cache/cache-keys.util';

// Mock server-only module for testing
vi.mock('server-only', () => ({}));

/**
 * Unit tests for Cache Service
 *
 * Tests cover:
 * - Cache provider initialization
 * - CRUD operations (get, set, delete, clear)
 * - Cache existence checks
 * - Pattern-based invalidation
 * - Cache statistics
 * - getOrSet pattern (cache-aside)
 * - Graceful error handling
 */

// Mock cache provider
class MockCacheProvider implements ICacheProvider {
  private store = new Map<string, unknown>();
  private stats = { hits: 0, misses: 0 };

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.store.has(key)) {
      this.stats.hits++;
      return this.store.get(key) as T;
    }
    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.store.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  async disconnect(): Promise<void> {
    // Mock disconnect
  }
}

describe('Cache Service', () => {
  let mockProvider: MockCacheProvider;
  let CacheService: typeof import('@/lib/cache/cache.service').CacheService;

  beforeEach(async () => {
    vi.resetModules();
    mockProvider = new MockCacheProvider();

    // Mock the cache factory to return our mock provider
    vi.doMock('@/lib/cache/cache.factory', () => ({
      CacheFactory: {
        createProvider: () => mockProvider,
      },
    }));

    // Import after mocking
    const module = await import('@/lib/cache/cache.service');
    CacheService = module.CacheService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Initialization', () => {
    it('should initialize cache provider', async () => {
      const service = new CacheService();
      const initSpy = vi.spyOn(mockProvider, 'initialize');

      await service.initialize();

      expect(initSpy).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const service = new CacheService();
      vi.spyOn(mockProvider, 'initialize').mockRejectedValueOnce(
        new Error('Init failed')
      );

      await expect(service.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('Get Operation', () => {
    it('should retrieve value from cache', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('test-key'), 'test-value');
      const value = await service.get(CacheKeys.testKey('test-key'));

      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const service = new CacheService();
      await service.initialize();

      const value = await service.get(CacheKeys.testKey('non-existent'));

      expect(value).toBeNull();
    });

    it('should handle get errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'get').mockRejectedValueOnce(
        new Error('Get failed')
      );

      const value = await service.get(CacheKeys.testKey('test-key'));

      expect(value).toBeNull();
    });
  });

  describe('Set Operation', () => {
    it('should store value in cache', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('test-key'), 'test-value');
      const value = await service.get<string>(CacheKeys.testKey('test-key'));

      expect(value).toBe('test-value');
    });

    it('should store objects in cache', async () => {
      const service = new CacheService();
      await service.initialize();

      const testObject = { id: 1, name: 'test' };
      await service.set(CacheKeys.testKey('object-key'), testObject);
      const value = await service.get(CacheKeys.testKey('object-key'));

      expect(value).toEqual(testObject);
    });

    it('should handle set with options', async () => {
      const service = new CacheService();
      await service.initialize();

      const setSpy = vi.spyOn(mockProvider, 'set');

      await service.set(CacheKeys.testKey('test-key'), 'test-value', {
        ttl: 3600,
      });

      expect(setSpy).toHaveBeenCalledWith('test-key', 'test-value', {
        ttl: 3600,
      });
    });

    it('should handle set errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'set').mockRejectedValueOnce(
        new Error('Set failed')
      );

      // Should not throw - errors are logged but swallowed
      await expect(
        service.set(CacheKeys.testKey('test-key'), 'test-value')
      ).resolves.not.toThrow();
    });
  });

  describe('Delete Operation', () => {
    it('should delete value from cache', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('test-key'), 'test-value');
      await service.delete(CacheKeys.testKey('test-key'));
      const value = await service.get(CacheKeys.testKey('test-key'));

      expect(value).toBeNull();
    });

    it('should handle delete of non-existent key', async () => {
      const service = new CacheService();
      await service.initialize();

      await expect(
        service.delete(CacheKeys.testKey('non-existent'))
      ).resolves.not.toThrow();
    });

    it('should handle delete errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'delete').mockRejectedValueOnce(
        new Error('Delete failed')
      );

      // Should not throw - errors are logged but swallowed
      await expect(
        service.delete(CacheKeys.testKey('test-key'))
      ).resolves.not.toThrow();
    });
  });

  describe('Clear Operation', () => {
    it('should clear all cache entries', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('key1'), 'value1');
      await service.set(CacheKeys.testKey('key2'), 'value2');
      await service.clear();

      const value1 = await service.get(CacheKeys.testKey('key1'));
      const value2 = await service.get(CacheKeys.testKey('key2'));

      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });

    it('should handle clear errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'clear').mockRejectedValueOnce(
        new Error('Clear failed')
      );

      // Should not throw - errors are logged but swallowed
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('Has Operation', () => {
    it('should return true for existing key', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('test-key'), 'test-value');
      const exists = await service.has(CacheKeys.testKey('test-key'));

      expect(exists).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const service = new CacheService();
      await service.initialize();

      const exists = await service.has(CacheKeys.testKey('non-existent'));

      expect(exists).toBe(false);
    });

    it('should handle has errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'has').mockRejectedValueOnce(
        new Error('Has failed')
      );

      const exists = await service.has(CacheKeys.testKey('test-key'));

      expect(exists).toBe(false);
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate keys matching pattern', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('user:1'), 'user1');
      await service.set(CacheKeys.testKey('user:2'), 'user2');
      await service.set(CacheKeys.testKey('product:1'), 'product1');

      const count = await service.invalidatePattern('test:user:*');

      expect(count).toBe(2);
      expect(await service.get(CacheKeys.testKey('user:1'))).toBeNull();
      expect(await service.get(CacheKeys.testKey('user:2'))).toBeNull();
      expect(await service.get(CacheKeys.testKey('product:1'))).toBe(
        'product1'
      );
    });

    it('should return 0 when no keys match pattern', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('user:1'), 'user1');

      const count = await service.invalidatePattern('test:product:*');

      expect(count).toBe(0);
    });

    it('should handle invalidation errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'invalidatePattern').mockRejectedValueOnce(
        new Error('Invalidation failed')
      );

      const count = await service.invalidatePattern('test:*');

      expect(count).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('key1'), 'value1');
      await service.get(CacheKeys.testKey('key1')); // Hit
      await service.get(CacheKeys.testKey('key2')); // Miss

      const stats = await service.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.keys).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should return zero stats for empty cache', async () => {
      const service = new CacheService();
      await service.initialize();

      const stats = await service.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.keys).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should handle stats errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'getStats').mockRejectedValueOnce(
        new Error('Stats failed')
      );

      const stats = await service.getStats();

      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        keys: 0,
        hitRate: 0,
      });
    });
  });

  describe('Get-or-Set Pattern', () => {
    it('should return cached value when available', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('test-key'), 'cached-value');

      const fetcher = vi.fn().mockResolvedValue('fetched-value');
      const value = await service.getOrSet(
        CacheKeys.testKey('test-key'),
        fetcher
      );

      expect(value).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache value when not cached', async () => {
      const service = new CacheService();
      await service.initialize();

      const fetcher = vi.fn().mockResolvedValue('fetched-value');
      const value = await service.getOrSet(
        CacheKeys.testKey('test-key'),
        fetcher
      );

      expect(value).toBe('fetched-value');
      expect(fetcher).toHaveBeenCalled();

      const cachedValue = await service.get(CacheKeys.testKey('test-key'));
      expect(cachedValue).toBe('fetched-value');
    });

    it('should pass options to set operation', async () => {
      const service = new CacheService();
      await service.initialize();

      const setSpy = vi.spyOn(mockProvider, 'set');
      const fetcher = vi.fn().mockResolvedValue('fetched-value');

      await service.getOrSet(CacheKeys.testKey('test-key'), fetcher, {
        ttl: 3600,
      });

      expect(setSpy).toHaveBeenCalledWith('test-key', 'fetched-value', {
        ttl: 3600,
      });
    });

    it('should handle fetcher errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(
        service.getOrSet(CacheKeys.testKey('test-key'), fetcher)
      ).rejects.toThrow('Fetch failed');

      const cachedValue = await service.get(CacheKeys.testKey('test-key'));
      expect(cachedValue).toBeNull();
    });

    it('should not cache when fetcher returns null', async () => {
      const service = new CacheService();
      await service.initialize();

      const fetcher = vi.fn().mockResolvedValue(null);
      const value = await service.getOrSet(
        CacheKeys.testKey('test-key'),
        fetcher
      );

      expect(value).toBeNull();

      const cachedValue = await service.get(CacheKeys.testKey('test-key'));
      expect(cachedValue).toBeNull();
    });
  });

  describe('Disconnect', () => {
    it('should disconnect from cache provider', async () => {
      const service = new CacheService();
      await service.initialize();

      const disconnectSpy = vi.spyOn(mockProvider, 'disconnect');

      await service.disconnect();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      const service = new CacheService();
      await service.initialize();

      vi.spyOn(mockProvider, 'disconnect').mockRejectedValueOnce(
        new Error('Disconnect failed')
      );

      await expect(service.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent get operations', async () => {
      const service = new CacheService();
      await service.initialize();

      await service.set(CacheKeys.testKey('key1'), 'value1');
      await service.set(CacheKeys.testKey('key2'), 'value2');
      await service.set(CacheKeys.testKey('key3'), 'value3');

      const results = await Promise.all([
        service.get(CacheKeys.testKey('key1')),
        service.get(CacheKeys.testKey('key2')),
        service.get(CacheKeys.testKey('key3')),
      ]);

      expect(results).toEqual(['value1', 'value2', 'value3']);
    });

    it('should handle multiple concurrent set operations', async () => {
      const service = new CacheService();
      await service.initialize();

      await Promise.all([
        service.set(CacheKeys.testKey('key1'), 'value1'),
        service.set(CacheKeys.testKey('key2'), 'value2'),
        service.set(CacheKeys.testKey('key3'), 'value3'),
      ]);

      expect(await service.get(CacheKeys.testKey('key1'))).toBe('value1');
      expect(await service.get(CacheKeys.testKey('key2'))).toBe('value2');
      expect(await service.get(CacheKeys.testKey('key3'))).toBe('value3');
    });

    it('should handle concurrent getOrSet operations', async () => {
      const service = new CacheService();
      await service.initialize();

      let callCount = 0;
      const fetcher = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(`value-${callCount}`);
      });

      // Multiple concurrent calls - each should call the fetcher
      const results = await Promise.all([
        service.getOrSet(CacheKeys.testKey('test-key'), fetcher),
        service.getOrSet(CacheKeys.testKey('test-key'), fetcher),
        service.getOrSet(CacheKeys.testKey('test-key'), fetcher),
      ]);

      // Note: Without locking, all might call the fetcher
      // In production, consider implementing a locking mechanism
      expect(results.length).toBe(3);
    });
  });
});
