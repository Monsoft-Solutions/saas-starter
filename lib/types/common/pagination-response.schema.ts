import { z } from 'zod';

/**
 * Common pagination response schema for API responses.
 * Contains metadata about the current page and whether more results exist.
 */
export const paginationResponseSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
});

/**
 * Pagination response type (inferred from schema).
 * Use this for API responses that include pagination metadata.
 */
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
