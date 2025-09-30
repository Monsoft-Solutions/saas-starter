/**
 * Cache operation options
 */
export type CacheOptions = {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Namespace/prefix for cache keys */
  namespace?: string;
  /** Skip cache and force fresh data */
  skipCache?: boolean;
};
