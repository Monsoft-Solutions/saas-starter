/**
 * Cache key type - branded type that can only be created through CacheKeys utility
 */
export type CacheKey = string & { __brand: 'CacheKey' };
