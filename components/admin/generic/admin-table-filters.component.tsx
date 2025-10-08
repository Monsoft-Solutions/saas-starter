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
import { useDebouncedCallback } from '@/lib/hooks/table/use-debounced-callback.hook';
import type { TableConfig } from '@/lib/types/table';

type AdminTableFiltersProps<TData, TFilters extends Record<string, unknown>> = {
  config: TableConfig<TData, TFilters>;
  filters: TFilters;
  onFiltersChange: (filters: Partial<TFilters>) => void;
  isLoading?: boolean;
};

/**
 * Generic filter renderer component.
 * Dynamically renders filter inputs based on configuration.
 *
 * @template TData - Shape of table row data
 * @template TFilters - Shape of filter state
 */
export function AdminTableFilters<
  TData,
  TFilters extends Record<string, unknown>,
>({
  config,
  filters,
  onFiltersChange,
  isLoading = false,
}: AdminTableFiltersProps<TData, TFilters>) {
  // Local state for search inputs (before debouncing)
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});

  /**
   * Create debounced callback for search inputs
   */
  const debouncedFilterChange = useDebouncedCallback(
    (key: keyof TFilters, value: unknown) => {
      onFiltersChange({ [key]: value || undefined } as Partial<TFilters>);
    },
    300
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback(
    (key: keyof TFilters, value: string) => {
      setSearchValues((prev) => ({ ...prev, [key as string]: value }));
      debouncedFilterChange(key, value);
    },
    [debouncedFilterChange]
  );

  /**
   * Handle select input change
   */
  const handleSelectChange = useCallback(
    (key: keyof TFilters, value: string) => {
      const parsedValue = value === 'all' ? undefined : value;
      onFiltersChange({ [key]: parsedValue } as Partial<TFilters>);
    },
    [onFiltersChange]
  );

  /**
   * Handle boolean filter change
   */
  const handleBooleanChange = useCallback(
    (key: keyof TFilters, value: string) => {
      const parsedValue = value === 'all' ? undefined : value === 'true';
      onFiltersChange({ [key]: parsedValue } as Partial<TFilters>);
    },
    [onFiltersChange]
  );

  /**
   * Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setSearchValues({});
    const clearedFilters = Object.keys(filters).reduce(
      (acc, key) => ({ ...acc, [key]: undefined }),
      {} as Partial<TFilters>
    );
    onFiltersChange(clearedFilters);
  }, [filters, onFiltersChange]);

  /**
   * Get active filter count (excluding pagination)
   */
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      key !== 'limit' &&
      key !== 'offset'
  ).length;

  /**
   * Render individual filter field
   */
  const renderFilterField = (filterDef: (typeof config.filters)[0]) => {
    const { key, type, label, placeholder, options, customRender } = filterDef;

    // Custom render
    if (customRender) {
      return customRender({
        value: filters[key],
        onChange: (value) =>
          onFiltersChange({ [key]: value } as Partial<TFilters>),
        disabled: isLoading,
      });
    }

    // Search input
    if (type === 'search') {
      return (
        <div key={String(key)} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={placeholder || `Search ${String(key)}...`}
            value={searchValues[String(key)] ?? (filters[key] as string) ?? ''}
            onChange={(e) => handleSearchChange(key, e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      );
    }

    // Select input
    if (type === 'select' && options) {
      return (
        <Select
          key={String(key)}
          value={String(filters[key] ?? 'all')}
          onValueChange={(value) => handleSelectChange(key, value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={placeholder || label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {label}</SelectItem>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Boolean filter (Yes/No)
    if (type === 'boolean') {
      return (
        <Select
          key={String(key)}
          value={filters[key] === undefined ? 'all' : String(filters[key])}
          onValueChange={(value) => handleBooleanChange(key, value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={placeholder || label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    return null;
  };

  /**
   * Render active filter badge
   */
  const renderActiveBadge = (key: keyof TFilters, value: unknown) => {
    // Skip pagination keys
    if (key === 'limit' || key === 'offset') return null;
    if (value === undefined || value === null || value === '') return null;

    const filterDef = config.filters.find((f) => f.key === key);
    const label = filterDef?.formatBadgeLabel
      ? filterDef.formatBadgeLabel(value as TFilters[keyof TFilters])
      : `${String(key)}: ${String(value)}`;

    return (
      <Badge key={String(key)} variant="secondary" className="gap-1">
        <Filter className="h-3 w-3" />
        {label}
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSearchValues((prev) => ({ ...prev, [key as string]: '' }));
            onFiltersChange({ [key]: undefined } as Partial<TFilters>);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {config.filters.map(renderFilterField)}

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
          {Object.entries(filters).map(([key, value]) =>
            renderActiveBadge(key as keyof TFilters, value)
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span>Loading {config.tableId}...</span>
        </div>
      )}
    </div>
  );
}
