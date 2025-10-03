import { z } from 'zod';

/**
 * Zod schema for pagination query parameters
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Zod schema for pagination metadata in responses
 */
export const paginationResponseSchema = z.object({
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
});

/**
 * Pagination query parameters type (derived from schema)
 */
export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Pagination metadata for API responses (derived from schema)
 */
export type Pagination = z.infer<typeof paginationResponseSchema>;
