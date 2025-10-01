import type { ICacheProvider } from './cache.interface';
import type { CacheOptions, CacheStats, CacheEntry } from '@/lib/types/cache';
import { logInfo, logWarn, logDebug } from '@/lib/logger/logger.service';

/**
 * In-Memory Cache Provider
 *
 * Simple Map-based caching for development and testing.
 * Not suitable for production in multi-instance deployments.
 *
 * Features:
 * - TTL support with automatic cleanup
 * - Namespace support
 * - Pattern-based invalidation
 * - Cache statistics tracking
 */
export class InMemoryCacheProvider implements ICacheProvider {
  private store: Map<string, CacheEntry<unknown>>;
  private stats: { hits: number; misses: number };
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.cleanupInterval = null;
  }

  async initialize(): Promise<void> {
    logInfo('Initializing In-Memory cache provider');

    // Start cleanup interval (every 60 seconds)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    logInfo('In-Memory cache provider initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      logDebug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if entry is expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.stats.misses++;
      logDebug(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    logDebug(`Cache HIT: ${key}`);
    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? null;

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : null,
      createdAt: Date.now(),
    };

    this.store.set(key, entry as CacheEntry<unknown>);
    logDebug(`Cache SET: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    logDebug(`Cache DELETE: ${key}`);
  }

  async clear(): Promise<void> {
    const size = this.store.size;
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
    logWarn(`Cache CLEARED: ${size} entries removed`);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    // Escape regex special chars, then replace escaped \* with .*
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);

    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    logDebug(`Cache INVALIDATE PATTERN: ${pattern} (${count} keys removed)`);
    return count;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.store.size,
      hitRate,
    };
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    logInfo('In-Memory cache provider disconnected');
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logDebug(`Cache cleanup: ${removed} expired entries removed`);
    }
  }
}
