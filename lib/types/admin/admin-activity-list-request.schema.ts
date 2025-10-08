import { z } from 'zod';
import { paginationRequestSchema } from '@/lib/types/common/pagination-request.schema';

/**
 * Query parameter schema for GET /api/admin/activity endpoint.
 *
 * Supports filtering by:
 * - userId: Filter by specific user ID
 * - action: Filter by action type
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - search: Search in user email or action
 * - includeStats: Include activity statistics in response
 * - limit/offset: Pagination (max 1000 per page)
 */
export const adminActivityListRequestSchema = paginationRequestSchema
  .omit({ limit: true })
  .extend({
    /**
     * Maximum number of items to return per page.
     * Defaults to 100, max 1000 (higher than typical pagination).
     */
    limit: z.coerce.number().int().min(1).max(1000).default(100),

    /**
     * Filter by specific user ID.
     */
    userId: z
      .string()
      .optional()
      .transform((val) => val ?? undefined),

    /**
     * Filter by action type (e.g., 'user.signin', 'team.create').
     */
    action: z
      .string()
      .optional()
      .transform((val) => val ?? undefined),

    /**
     * Filter by start date (ISO 8601 format).
     * Only activities after this date will be included.
     */
    startDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),

    /**
     * Filter by end date (ISO 8601 format).
     * Only activities before this date will be included.
     */
    endDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),

    /**
     * Search query to filter results.
     * Applied to user email and action fields.
     */
    search: z
      .string()
      .trim()
      .optional()
      .transform((val) => val ?? undefined),

    /**
     * Include activity statistics in the response.
     * When true, adds aggregated activity metrics.
     */
    includeStats: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
  });

/**
 * Admin activity list request type (inferred from schema).
 */
export type AdminActivityListRequest = z.infer<
  typeof adminActivityListRequestSchema
>;
