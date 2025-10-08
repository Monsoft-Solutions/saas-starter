import { z } from 'zod';

/**
 * Schema for cache statistics response
 * GET /api/cache/stats
 */
export const cacheStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    hits: z.number().int().nonnegative(),
    misses: z.number().int().nonnegative(),
    keys: z.number().int().nonnegative(),
    hitRate: z.number().min(0).max(1),
  }),
});

/**
 * Type for cache statistics response
 */
export type CacheStatsResponse = z.infer<typeof cacheStatsResponseSchema>;
