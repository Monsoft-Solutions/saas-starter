import { Redis } from '@upstash/redis';
import type { ICacheProvider } from './cache.interface';
import type { CacheOptions, CacheStats } from '@/lib/types/cache';
import {
  logInfo,
  logError,
  logDebug,
  logWarn,
} from '@/lib/logger/logger.service';
import { env } from '@/lib/env';

/**
 * Upstash Redis Cache Provider
 *
 * Serverless Redis caching for production environments.
 * Uses Upstash's REST API for edge-compatible caching.
 *
 * Features:
 * - Distributed caching
 * - Durable storage
 * - Edge-compatible
 * - Automatic TTL support
 * - Pattern-based invalidation
 */
export class UpstashCacheProvider implements ICacheProvider {
  private redis: Redis;
  private readonly STATS_KEY = '__cache:stats';

  constructor() {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
      );
    }

    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.redis.ping();
      logInfo('Upstash Redis cache provider initialized');
    } catch (error) {
      logError('Failed to initialize Upstash Redis', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key);

      if (value === null) {
        await this.incrementStat('misses');
        logDebug(`Cache MISS: ${key}`);
        return null;
      }

      await this.incrementStat('hits');
      logDebug(`Cache HIT: ${key}`);
      return value;
    } catch (error) {
      logError(`Cache GET error for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl ?? env.CACHE_DEFAULT_TTL;

      if (ttl) {
        await this.redis.set(key, value, { ex: ttl });
      } else {
        await this.redis.set(key, value);
      }

      logDebug(`Cache SET: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      logError(`Cache SET error for key: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logDebug(`Cache DELETE: ${key}`);
    } catch (error) {
      logError(`Cache DELETE error for key: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      logWarn('Cache CLEARED: All entries removed');
    } catch (error) {
      logError('Cache CLEAR error', error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logError(`Cache HAS error for key: ${key}`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      logDebug(
        `Cache INVALIDATE PATTERN: ${pattern} (${keys.length} keys removed)`
      );

      return keys.length;
    } catch (error) {
      logError(`Cache INVALIDATE PATTERN error for pattern: ${pattern}`, error);
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const stats = await this.redis.hgetall<Record<string, number>>(
        this.STATS_KEY
      );
      const hits = stats?.hits || 0;
      const misses = stats?.misses || 0;
      const total = hits + misses;
      const hitRate = total > 0 ? hits / total : 0;

      const dbsize = await this.redis.dbsize();

      return {
        hits,
        misses,
        keys: dbsize,
        hitRate,
      };
    } catch (error) {
      logError('Cache STATS error', error);

      return {
        hits: 0,
        misses: 0,
        keys: 0,
        hitRate: 0,
      };
    }
  }

  async disconnect(): Promise<void> {
    // Upstash Redis uses HTTP REST API, no persistent connection to close
    logInfo('Upstash Redis cache provider disconnected');
  }

  /**
   * Increment a stat counter in Redis
   * @private
   */
  private async incrementStat(stat: 'hits' | 'misses'): Promise<void> {
    try {
      await this.redis.hincrby(this.STATS_KEY, stat, 1);
    } catch (error) {
      // Don't fail the cache operation if stats update fails
      logError(`Failed to increment stat: ${stat}`, error);
    }
  }
}
