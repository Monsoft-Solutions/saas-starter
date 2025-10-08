import { z } from 'zod';

/**
 * Query parameter schema for GET /api/admin/stats endpoint.
 *
 * Supports:
 * - refresh: Force refresh of cached statistics
 */
export const adminStatsRequestSchema = z.object({
  /**
   * Force refresh of cached statistics.
   * When true, refreshes the cache before returning data.
   * Requires 'analytics:write' permission.
   */
  refresh: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * Admin stats request type (inferred from schema).
 */
export type AdminStatsRequest = z.infer<typeof adminStatsRequestSchema>;
