/**
 * Internal cache entry structure
 */
export type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
  createdAt: number;
};
