/**
 * Pagination configuration for tables
 */
export type PaginationConfig = {
  /** Default page size */
  defaultLimit: number;

  /** Available page size options */
  pageSizeOptions: number[];

  /** Show page size selector */
  showPageSizeSelector: boolean;
};
