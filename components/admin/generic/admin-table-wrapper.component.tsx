'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AdminTable } from './admin-table.component';
import { AdminTableFilters } from './admin-table-filters.component';
import { useTableUrlSync } from '@/lib/hooks/table/use-table-url-sync.hook';
import type { TableConfig, TableDataResponse } from '@/lib/types/table';

/**
 * Props for AdminTableWrapper component.
 *
 * @template TData - Shape of table row data
 * @template TFilters - Shape of filter state
 */
type AdminTableWrapperProps<TData, TFilters extends Record<string, unknown>> = {
  /** Table configuration object */
  config: TableConfig<TData, TFilters>;

  /** Initial data from server */
  initialData: TableDataResponse<TData>;

  /** Initial filter state */
  initialFilters: TFilters;
};

/**
 * Generic admin table wrapper with state management.
 * Handles filtering, pagination, URL synchronization, and data fetching.
 *
 * @template TData - Shape of table row data
 * @template TFilters - Shape of filter state
 */
export function AdminTableWrapper<
  TData,
  TFilters extends Record<string, unknown>,
>({
  config,
  initialData,
  initialFilters,
}: AdminTableWrapperProps<TData, TFilters>) {
  const { updateUrlParams } = useTableUrlSync<TFilters>();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Update filters, sync URL, and fetch new data
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<TFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Reset offset when changing filters (not pagination)
      const isFilterChange = Object.keys(newFilters).some(
        (key) => key !== 'limit' && key !== 'offset'
      );

      if (isFilterChange && 'offset' in updatedFilters) {
        (updatedFilters as Record<string, unknown>).offset = 0;
      }

      setFilters(updatedFilters);
      setIsLoading(true);

      // Update URL using the hook
      updateUrlParams(updatedFilters);

      try {
        // Build query string for API
        const queryParams = new URLSearchParams();

        Object.entries(updatedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.set(key, String(value));
          }
        });

        const response = await fetch(
          `${config.apiEndpoint}?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ${config.tableId} data`);
        }

        const newData = await response.json();

        // Only update data if we have a valid response structure
        if (newData && typeof newData === 'object' && 'data' in newData) {
          setData(newData);
        } else {
          throw new Error(`Invalid response format for ${config.tableId}`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${config.tableId}:`, error);
        toast.error(`Failed to load ${config.tableId}`, {
          description:
            error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [filters, updateUrlParams, config]
  );

  /**
   * Handle pagination change
   */
  const handlePageChange = useCallback(
    (newOffset: number) => {
      updateFilters({ offset: newOffset } as unknown as Partial<TFilters>);
    },
    [updateFilters]
  );

  /**
   * Handle page size change
   */
  const handleLimitChange = useCallback(
    (newLimit: number) => {
      updateFilters({
        limit: newLimit,
        offset: 0,
      } as unknown as Partial<TFilters>);
    },
    [updateFilters]
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      {config.filters && config.filters.length > 0 && (
        <AdminTableFilters
          config={config}
          filters={filters}
          onFiltersChange={updateFilters}
          isLoading={isLoading}
        />
      )}

      {/* Table */}
      <AdminTable
        config={config as TableConfig<TData, unknown>}
        data={data?.data}
        total={data?.total ?? 0}
        limit={data?.limit ?? 50}
        offset={data?.offset ?? 0}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
