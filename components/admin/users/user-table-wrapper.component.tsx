'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserTableClient } from './user-table-client.component';
import { UserFilters } from './user-filters.component';
import type { UserTableData } from './user-table-client.component';

type UserListFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};

type UserListResponse = {
  users: UserTableData[];
  total: number;
  limit: number;
  offset: number;
};

type UserTableWrapperProps = {
  initialData: UserListResponse;
  initialFilters: UserListFilters;
};

/**
 * Client-side wrapper for user table with state management.
 * Handles filtering, pagination, and user management dialogs.
 */
export function UserTableWrapper({
  initialData,
  initialFilters,
}: UserTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Update URL search parameters and fetch new data
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<UserListFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Reset offset when changing filters (except pagination)
      if ('search' in newFilters || 'role' in newFilters) {
        updatedFilters.offset = 0;
      }

      setFilters(updatedFilters);
      setIsLoading(true);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());

      if (updatedFilters.search) {
        params.set('search', updatedFilters.search);
      } else {
        params.delete('search');
      }

      if (updatedFilters.role && updatedFilters.role !== 'all') {
        params.set('role', updatedFilters.role);
      } else {
        params.delete('role');
      }

      if (updatedFilters.limit !== 50) {
        params.set('limit', updatedFilters.limit!.toString());
      } else {
        params.delete('limit');
      }

      if (updatedFilters.offset !== 0) {
        params.set('offset', updatedFilters.offset!.toString());
      } else {
        params.delete('offset');
      }

      router.push(`?${params.toString()}`, { scroll: false });

      try {
        // Fetch new data
        const queryParams = new URLSearchParams();
        if (updatedFilters.search)
          queryParams.set('search', updatedFilters.search);
        if (updatedFilters.role && updatedFilters.role !== 'all')
          queryParams.set('role', updatedFilters.role);
        queryParams.set('limit', (updatedFilters.limit || 50).toString());
        queryParams.set('offset', (updatedFilters.offset || 0).toString());

        const response = await fetch(
          `/api/admin/users?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const newData = await response.json();
        setData(newData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // TODO: Show error toast
      } finally {
        setIsLoading(false);
      }
    },
    [filters, router, searchParams]
  );

  /**
   * Handle pagination
   */
  const handlePageChange = useCallback(
    (newOffset: number) => {
      updateFilters({ offset: newOffset });
    },
    [updateFilters]
  );

  /**
   * Handle limit change
   */
  const handleLimitChange = useCallback(
    (newLimit: number) => {
      updateFilters({ limit: newLimit, offset: 0 }); // Reset to first page when changing limit
    },
    [updateFilters]
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={updateFilters}
        isLoading={isLoading}
      />

      {/* Table */}
      <UserTableClient
        users={data.users}
        total={data.total}
        limit={data.limit}
        offset={data.offset}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
