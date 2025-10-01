/**
 * Cache statistics for monitoring
 */
export type CacheStats = {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
};
