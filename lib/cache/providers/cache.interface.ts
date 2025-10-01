import type { CacheOptions, CacheStats } from '@/lib/types/cache';

/**
 * Abstract cache provider interface
 * All cache providers must implement this interface
 */
export interface ICacheProvider {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (TTL, namespace, etc.)
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache entries (use with caution)
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete all keys matching pattern
   * @param pattern Pattern to match (e.g., "user:*")
   */
  invalidatePattern(pattern: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Initialize cache provider
   */
  initialize(): Promise<void>;

  /**
   * Disconnect from cache provider
   */
  disconnect(): Promise<void>;
}
