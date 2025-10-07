/**
 * Generic API response type for table data.
 * Enforces consistent response structure across all admin tables.
 *
 * @template TData - The shape of individual data items
 */
export type TableDataResponse<TData> = {
  /** Array of data items */
  data: TData[];

  /** Total count of items (for pagination) */
  total: number;

  /** Current page size */
  limit: number;

  /** Current offset */
  offset: number;
};
