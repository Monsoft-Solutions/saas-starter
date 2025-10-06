'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrganizationTable } from './organization-table.component';
import type { OrganizationListFilters } from '@/lib/types/admin';
import { OrganizationDetailsDialog } from './organization-details-dialog.component';
import { OrganizationFilters } from './organization-filters.component';

/**
 * Organization data type from the API response
 */
type OrganizationData = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  createdAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  memberCount: number;
};

type OrganizationListResponse = {
  organizations: OrganizationData[];
  total: number;
  limit: number;
  offset: number;
};

type OrganizationTableClientProps = {
  initialData: OrganizationListResponse;
  initialFilters: OrganizationListFilters;
};

/**
 * Client-side wrapper for organization table with state management.
 * Handles filtering, pagination, and organization details dialog.
 */
export function OrganizationTableClient({
  initialData,
  initialFilters,
}: OrganizationTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  /**
   * Update URL search parameters and fetch new data
   */
  const updateFilters = useCallback(
    async (newFilters: Partial<OrganizationListFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Reset offset when changing filters (except pagination)
      if (
        'search' in newFilters ||
        'subscriptionStatus' in newFilters ||
        'hasSubscription' in newFilters
      ) {
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

      if (updatedFilters.subscriptionStatus) {
        params.set('subscriptionStatus', updatedFilters.subscriptionStatus);
      } else {
        params.delete('subscriptionStatus');
      }

      if (updatedFilters.hasSubscription !== undefined) {
        params.set(
          'hasSubscription',
          updatedFilters.hasSubscription.toString()
        );
      } else {
        params.delete('hasSubscription');
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
        if (updatedFilters.subscriptionStatus)
          queryParams.set(
            'subscriptionStatus',
            updatedFilters.subscriptionStatus
          );
        if (updatedFilters.hasSubscription !== undefined)
          queryParams.set(
            'hasSubscription',
            updatedFilters.hasSubscription.toString()
          );
        queryParams.set('limit', (updatedFilters.limit || 50).toString());
        queryParams.set('offset', (updatedFilters.offset || 0).toString());

        const response = await fetch(
          `/api/admin/organizations?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const newData = await response.json();
        setData(newData);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
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

  /**
   * Handle organization selection for details dialog
   */
  const handleOrganizationSelect = useCallback((organizationId: string) => {
    setSelectedOrganizationId(organizationId);
  }, []);

  /**
   * Close organization details dialog
   */
  const handleCloseDialog = useCallback(() => {
    setSelectedOrganizationId(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <OrganizationFilters
        filters={filters}
        onFiltersChange={updateFilters}
        isLoading={isLoading}
      />

      {/* Table */}
      <OrganizationTable
        organizations={data.organizations}
        total={data.total}
        limit={data.limit}
        offset={data.offset}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onOrganizationSelect={handleOrganizationSelect}
      />

      {/* Organization Details Dialog */}
      {selectedOrganizationId && (
        <OrganizationDetailsDialog
          organizationId={selectedOrganizationId}
          open={!!selectedOrganizationId}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
