/**
 * Cache Module Exports
 *
 * Centralized exports for the caching system.
 * Import from this file for consistent cache access across the application.
 *
 * @example
 * import { cacheService, CacheKeys } from '@/lib/cache';
 *
 * // Use cache service
 * const user = await cacheService.get<User>(CacheKeys.user(userId));
 */

export { cacheService } from './cache.service';
export { CacheKeys } from './cache-keys.util';
export type { ICacheProvider } from './providers/cache.interface';

// Re-export cache types
export type { CacheOptions, CacheStats, CacheEntry } from '@/lib/types/cache';

export { CacheProvider } from '@/lib/types/cache';
