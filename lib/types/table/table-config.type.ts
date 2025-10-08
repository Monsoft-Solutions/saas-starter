import type { z } from 'zod';
import type { ColumnDefinition } from './column-definition.type';
import type { FilterDefinition } from './filter-definition.type';
import type { ActionDefinition } from './action-definition.type';
import type { PaginationConfig } from './pagination-config.type';

/**
 * Route definition structure from routes.config.ts
 */
export type RouteDefinition<
  TQuerySchema extends z.ZodTypeAny = z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  readonly path: string | ((...params: string[]) => string);
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly querySchema?: TQuerySchema;
  readonly responseSchema: TResponseSchema;
};

/**
 * Generic table configuration type.
 * Defines the complete structure for any admin table.
 *
 * @template TData - The shape of a single row data object
 * @template TFilters - The shape of the filter state object
 */
export type TableConfig<TData, TFilters> = {
  /** Unique identifier for the table (used for logging/debugging) */
  tableId: string;

  /** Column definitions with type-safe accessors */
  columns: ColumnDefinition<TData>[];

  /** Filter field definitions */
  filters: FilterDefinition<TFilters>[];

  /** Row action definitions (view, edit, delete, etc.) */
  actions?: ActionDefinition<TData>[];

  /** Pagination configuration */
  pagination?: PaginationConfig;

  /** API route definition from routes.config.ts */
  route: RouteDefinition<z.ZodTypeAny, z.ZodTypeAny>;

  /** Empty state configuration */
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
  };

  /** Loading skeleton configuration */
  skeletonRows?: number;
};
