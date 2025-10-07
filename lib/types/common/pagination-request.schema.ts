import { z } from 'zod';

/**
 * Common pagination query parameter schema for API requests.
 * Use with `inputSource: 'query'` in validated API handlers.
 *
 * @example
 * ```typescript
 * export const GET = createValidatedAuthenticatedHandler(
 *   paginationRequestSchema,
 *   responseSchema,
 *   async ({ data }) => {
 *     const { limit, offset } = data;
 *     // Use limit and offset for database queries
 *   },
 *   { inputSource: 'query' }
 * );
 * ```
 */
export const paginationRequestSchema = z.object({
  /**
   * Maximum number of items to return per page.
   * Defaults to 50, max 100.
   */
  limit: z.coerce.number().int().min(1).max(100).default(50),

  /**
   * Number of items to skip (for pagination).
   * Defaults to 0.
   */
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Pagination request parameters type (inferred from schema).
 * Use this for type-safe pagination handling in API routes.
 */
export type PaginationRequest = z.infer<typeof paginationRequestSchema>;

/**
 * Extended pagination schema with optional search parameter.
 * Commonly used for list endpoints that support filtering.
 */
export const searchablePaginationRequestSchema = paginationRequestSchema.extend(
  {
    /**
     * Optional search query to filter results.
     * Applied to relevant fields (e.g., name, email).
     */
    search: z.string().trim().optional(),
  }
);

/**
 * Searchable pagination request type (inferred from schema).
 */
export type SearchablePaginationRequest = z.infer<
  typeof searchablePaginationRequestSchema
>;
