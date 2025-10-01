/**
 * Cache operation options
 */
export type CacheOptions = {
  /** Time-to-live in seconds */
  ttl?: number;

  /** Skip cache and force fresh data */
  skipCache?: boolean;
};
