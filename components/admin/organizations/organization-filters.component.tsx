'use client';

import { useState, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationListFilters } from '@/lib/types/admin';

type OrganizationFiltersProps = {
  filters: OrganizationListFilters;
  onFiltersChange: (filters: Partial<OrganizationListFilters>) => void;
  isLoading?: boolean;
};

/**
 * Organization filters component for search and subscription status filtering.
 * Provides search input, subscription status filter, and active filter badges.
 */
export function OrganizationFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: OrganizationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  /**
   * Handle search input change with debouncing
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ search: value || undefined });
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [onFiltersChange]
  );

  /**
   * Handle subscription status filter change
   */
  const handleSubscriptionStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        subscriptionStatus: value === 'all' ? undefined : value,
      });
    },
    [onFiltersChange]
  );

  /**
   * Handle subscription presence filter change
   */
  const handleHasSubscriptionChange = useCallback(
    (value: string) => {
      const hasSubscription = value === 'all' ? undefined : value === 'true';
      onFiltersChange({ hasSubscription });
    },
    [onFiltersChange]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    onFiltersChange({
      search: undefined,
      subscriptionStatus: undefined,
      hasSubscription: undefined,
    });
  }, [onFiltersChange]);

  /**
   * Get active filter count
   */
  const activeFilterCount = [
    filters.search,
    filters.subscriptionStatus,
    filters.hasSubscription !== undefined ? 'hasSubscription' : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations by name or slug..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Subscription Status Filter */}
        <Select
          value={filters.subscriptionStatus || 'all'}
          onValueChange={handleSubscriptionStatusChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Subscription Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="trialing">Trial</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>

        {/* Has Subscription Filter */}
        <Select
          value={
            filters.hasSubscription === undefined
              ? 'all'
              : filters.hasSubscription.toString()
          }
          onValueChange={handleHasSubscriptionChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Subscription" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            <SelectItem value="true">With Subscription</SelectItem>
            <SelectItem value="false">No Subscription</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="shrink-0"
          >
            <X className="mr-2 h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" />
              Search: {filters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ search: undefined });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.subscriptionStatus && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              Status: {filters.subscriptionStatus}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  onFiltersChange({ subscriptionStatus: undefined })
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.hasSubscription !== undefined && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {filters.hasSubscription
                ? 'With Subscription'
                : 'No Subscription'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onFiltersChange({ hasSubscription: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Loading organizations...
        </div>
      )}
    </div>
  );
}
