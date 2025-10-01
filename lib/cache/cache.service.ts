import 'server-only';
import type { ICacheProvider } from './providers/cache.interface';
import { CacheFactory } from './cache.factory';
import type { CacheOptions, CacheStats } from '@/lib/types/cache';
import { logError, logInfo } from '@/lib/logger';
import { env } from '@/lib/env';
import { CacheKey } from '../types/cache/cache-key.type';

/**
 * Cache Service
 *
 * Centralized caching service that provides a unified interface
 * for all caching operations. Automatically selects the appropriate
 * provider based on environment configuration.
 *
 * Usage:
 * ```typescript
 * import { cacheService } from '@/lib/cache';
 *
 * // Set value
 * await cacheService.set('user:123', userData, { ttl: 3600 });
 *
 * // Get value
 * const user = await cacheService.get<User>('user:123');
 *
 * // Get or set pattern
 * const user = await cacheService.getOrSet(
 *   'user:123',
 *   async () => await fetchUser(123),
 *   { ttl: 3600 }
 * );
 * ```
 */
class CacheService {
  private provider: ICacheProvider;
  private initialized: boolean = false;

  constructor() {
    this.provider = CacheFactory.createProvider();
  }

  /**
   * Initialize cache provider (call once on app startup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.provider.initialize();
      this.initialized = true;
      logInfo('Cache service initialized successfully');
    } catch (error) {
      logError('Failed to initialize cache service', error);

      // In production, fall back to in-memory provider
      if (env.NODE_ENV === 'production') {
        logInfo('Falling back to in-memory cache provider');
        // Force creation of in-memory provider as fallback
        const { InMemoryCacheProvider } = await import(
          './providers/in-memory.provider'
        );
        this.provider = new InMemoryCacheProvider();
        try {
          await this.provider.initialize();
          this.initialized = true;
          logInfo('In-memory cache provider initialized as fallback');
        } catch (fallbackError) {
          logError(
            'Failed to initialize fallback cache provider',
            fallbackError
          );
          throw fallbackError;
        }
      } else {
        // In dev/staging, fail fast to surface issues
        throw error;
      }
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    try {
      return await this.provider.get<T>(key);
    } catch (error) {
      logError(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    try {
      const defaultTtl = env.CACHE_DEFAULT_TTL;
      const finalOptions = {
        ...options,
        ttl: options?.ttl ?? defaultTtl,
      };

      await this.provider.set(key, value, finalOptions);
    } catch (error) {
      logError(`Cache set error for key: ${key}`, error);
      // Don't throw - cache failures should not break the app
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: CacheKey): Promise<void> {
    try {
      await this.provider.delete(key);
    } catch (error) {
      logError(`Cache delete error for key: ${key}`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.provider.clear();
    } catch (error) {
      logError('Cache clear error', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: CacheKey): Promise<boolean> {
    try {
      return await this.provider.has(key);
    } catch (error) {
      logError(`Cache has error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get value from cache or set it if not found
   *
   * @param key Cache key
   * @param factory Function to generate value if not in cache
   * @param options Cache options
   */
  async getOrSet<T>(
    key: CacheKey,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Skip cache if requested
    if (options?.skipCache) {
      return await factory();
    }

    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate fresh value
    const value = await factory();

    // Cache the value only if not null or undefined
    if (value !== null && value !== undefined) {
      await this.set(key, value, options);
    }

    return value;
  }

  /**
   * Invalidate cache keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      return await this.provider.invalidatePattern(pattern);
    } catch (error) {
      logError(`Cache invalidate pattern error for pattern: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      return await this.provider.getStats();
    } catch (error) {
      logError('Cache stats error', error);
      return {
        hits: 0,
        misses: 0,
        keys: 0,
        hitRate: 0,
      };
    }
  }

  /**
   * Disconnect from cache provider (call on app shutdown)
   */
  async disconnect(): Promise<void> {
    try {
      await this.provider.disconnect();
      this.initialized = false;
      logInfo('Cache service disconnected');
    } catch (error) {
      logError('Cache disconnect error', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export class for testing purposes
export { CacheService };
