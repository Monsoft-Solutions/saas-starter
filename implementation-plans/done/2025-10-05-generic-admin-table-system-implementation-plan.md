# Generic Extensible Admin Table System - Implementation Plan

**Date:** October 5, 2025
**Author:** Claude (Senior Software Architect)
**Status:** Ready for Implementation

---

## Executive Summary

This implementation plan outlines the creation of a **Generic Extensible Admin Table System** to eliminate code duplication across admin tables (Users, Organizations, and future tables). The current codebase has **~1,000 lines of duplicated table logic** across two implementations. This refactoring will reduce that to **~100 lines of config per table** while maintaining full type safety and all existing features.

### Key Benefits

- **Zero code duplication** - Shared wrapper, table, and filter logic
- **Type-safe generics** - Full TypeScript inference throughout
- **Easy extensibility** - New tables require <100 lines of config
- **Consistent UX** - Unified patterns across all admin tables
- **Maintainable** - Single source of truth for table logic

### Success Metrics

- [ ] Code reduction: From ~1,000 to ~300 lines total (70% reduction)
- [ ] Adding new table: <100 lines of configuration
- [ ] Zero TypeScript `any` types
- [ ] All existing features preserved
- [ ] 100% backward compatible migration

---

## Table of Contents

1. [Technical Analysis](#technical-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Type System Design](#type-system-design)
4. [Implementation Phases](#implementation-phases)
5. [Code Examples](#code-examples)
6. [Migration Strategy](#migration-strategy)
7. [Testing & Validation](#testing--validation)
8. [References](#references)

---

## Technical Analysis

### Current State Assessment

#### Problems Identified

1. **Code Duplication (Critical)**
   - State management duplicated across UserTableWrapper & OrganizationTableClient
   - URL parameter logic identical in both implementations
   - Debounced search implemented twice (same 300ms delay)
   - Pagination callbacks duplicated
   - Filter management logic repeated

2. **Inconsistent Patterns**
   - User table: Uses TanStack Table (better approach)
   - Organization table: Manual table rendering (less maintainable)
   - User table: Better component separation (Wrapper → Client)
   - Organization table: Monolithic structure

3. **Type Safety Issues**
   - Filter types defined locally in components (not reusable)
   - No generic abstractions for table configuration
   - Response types duplicated per table

#### Files to Refactor

```
components/admin/users/
├── user-table-wrapper.component.tsx (159 lines) → DELETE
├── user-table-client.component.tsx (308 lines) → REPLACE
└── user-filters.component.tsx (183 lines) → REPLACE

components/admin/organizations/
├── organization-table-client.component.tsx (218 lines) → REPLACE
├── organization-table.component.tsx (318 lines) → DELETE
└── organization-filters.component.tsx (233 lines) → REPLACE

components/admin/shared/
└── table-pagination.component.tsx (184 lines) → KEEP (already shared)
```

**Total Code to Refactor:** ~1,419 lines → **~300 lines** (generic + configs)

### Technology Stack Assessment

- **TanStack Table v8.21.3** ✅ Perfect for generics, full TypeScript support
- **Next.js 15** ✅ Server Components + Client Components pattern
- **TypeScript 5.9** ✅ Advanced generics and type inference
- **Tailwind CSS v4** ✅ Design tokens from `app/globals.css`
- **shadcn/ui** ✅ Composable components

### Dependencies Review

All required dependencies are already installed:

- `@tanstack/react-table`: ^8.21.3 (core table logic)
- `zod`: ^3.25.76 (schema validation)
- `date-fns`: ^4.1.0 (date formatting)
- `lucide-react`: ^0.511.0 (icons)

---

## Architecture Overview

### Design Principles

1. **Generic First**: All components use TypeScript generics for full type inference
2. **Separation of Concerns**: Clear boundaries between data, UI, and logic
3. **Configuration Over Code**: Tables defined via config objects, not custom components
4. **Type Safety**: No `any` types, full inference from data to UI
5. **Composition**: Reusable primitives that compose into complex tables

### Component Hierarchy

```
AdminTableWrapper<TData, TFilters>          [Generic State Management]
├── AdminTableFilters<TFilters>             [Generic Filter Renderer]
│   ├── FilterField (search)                [Reusable filter components]
│   ├── FilterField (select)
│   ├── FilterField (date-range)
│   └── ActiveFilterBadges
│
└── AdminTable<TData>                       [Generic Table Renderer]
    ├── TanStack Table (core)               [Sorting, state management]
    ├── Column Definitions                  [From config]
    ├── Row Actions Dropdown                [From config]
    └── TablePagination                     [Existing shared component]
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Server Component (Page)                       │
│  - Fetches initial data from API                                │
│  - Parses URL params → initialFilters                           │
│  - Passes data + config to AdminTableWrapper                    │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          AdminTableWrapper<TData, TFilters> [CLIENT]            │
│                                                                  │
│  State Management:                                              │
│  ├── data: TData[]                                              │
│  ├── filters: TFilters                                          │
│  ├── isLoading: boolean                                         │
│  │                                                               │
│  Core Logic:                                                    │
│  ├── updateFilters(newFilters) → Update URL + Fetch            │
│  ├── handlePageChange(offset) → Update pagination              │
│  ├── handleLimitChange(limit) → Update page size               │
│  │                                                               │
│  URL Sync:                                                      │
│  ├── Reads: useSearchParams()                                   │
│  ├── Updates: router.push() with scroll: false                 │
│  └── Resets offset when non-pagination filters change          │
└────────────────┬───────────────────────────┬────────────────────┘
                 ▼                           ▼
    ┌────────────────────────┐  ┌───────────────────────────┐
    │ AdminTableFilters      │  │ AdminTable                │
    │ <TFilters>             │  │ <TData>                   │
    │                        │  │                           │
    │ - Renders filter UI    │  │ - TanStack Table          │
    │ - Debounced search     │  │ - Column rendering        │
    │ - Active badges        │  │ - Row actions             │
    │ - Clear filters        │  │ - Sorting                 │
    └────────────────────────┘  └───────────────────────────┘
```

### File Structure

```
lib/types/table/                          [NEW - Type Definitions]
├── index.ts                              (exports all types)
├── table-config.type.ts                  (main config type)
├── column-definition.type.ts             (column config)
├── filter-definition.type.ts             (filter config)
├── filter-field-type.enum.ts             (filter types: search, select, etc.)
├── action-definition.type.ts             (row actions)
├── table-data-response.type.ts           (API response shape)
└── pagination-config.type.ts             (pagination settings)

lib/hooks/table/                          [NEW - Shared Hooks]
├── use-debounced-callback.hook.ts        (proper cleanup)
└── use-table-url-sync.hook.ts            (URL param management)

components/admin/generic/                 [NEW - Generic Components]
├── admin-table-wrapper.component.tsx     (generic state wrapper)
├── admin-table.component.tsx             (generic TanStack table)
├── admin-table-filters.component.tsx     (generic filter renderer)
└── filter-fields/                        (reusable filter inputs)
    ├── search-filter.component.tsx
    ├── select-filter.component.tsx
    ├── date-range-filter.component.tsx
    └── active-filter-badges.component.tsx

components/admin/users/                   [REFACTORED]
├── user-table-config.ts                  (config only, ~80 lines)
├── user-table.component.tsx              (server wrapper, ~30 lines)
├── user-details-dialog.component.tsx     (KEEP)
├── update-role-dialog.component.tsx      (KEEP)
└── ban-user-dialog.component.tsx         (KEEP)

components/admin/organizations/           [REFACTORED]
├── organization-table-config.ts          (config only, ~100 lines)
├── organization-table.component.tsx      (server wrapper, ~30 lines)
└── organization-details-dialog.component.tsx (KEEP)
```

---

## Type System Design

### Core Type Definitions

#### 1. Table Configuration Type

**File:** `/lib/types/table/table-config.type.ts`

```typescript
import type { ColumnDefinition } from './column-definition.type';
import type { FilterDefinition } from './filter-definition.type';
import type { ActionDefinition } from './action-definition.type';
import type { PaginationConfig } from './pagination-config.type';

/**
 * Generic table configuration type.
 * Defines the complete structure for any admin table.
 *
 * @template TData - The shape of a single row data object
 * @template TFilters - The shape of the filter state object
 */
export type TableConfig<TData, TFilters> = {
  /** Unique identifier for the table (used for API endpoints) */
  tableId: string;

  /** Column definitions with type-safe accessors */
  columns: ColumnDefinition<TData>[];

  /** Filter field definitions */
  filters: FilterDefinition<TFilters>[];

  /** Row action definitions (view, edit, delete, etc.) */
  actions?: ActionDefinition<TData>[];

  /** Pagination configuration */
  pagination?: PaginationConfig;

  /** API endpoint for fetching data */
  apiEndpoint: string;

  /** Empty state configuration */
  emptyState?: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
  };

  /** Loading skeleton configuration */
  skeletonRows?: number;
};
```

#### 2. Column Definition Type

**File:** `/lib/types/table/column-definition.type.ts`

```typescript
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Extended column definition with custom rendering and formatting.
 * Wraps TanStack Table's ColumnDef with additional metadata.
 *
 * @template TData - The shape of row data
 */
export type ColumnDefinition<TData> = ColumnDef<TData> & {
  /** Column unique identifier */
  id?: string;

  /** Column header label */
  header: string;

  /** Data accessor key (typed against TData) */
  accessorKey?: keyof TData;

  /** Custom cell renderer */
  cell?: (props: { row: { original: TData } }) => React.ReactNode;

  /** Enable/disable sorting for this column */
  enableSorting?: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Column alignment */
  align?: 'left' | 'center' | 'right';
};
```

#### 3. Filter Definition Type

**File:** `/lib/types/table/filter-definition.type.ts`

```typescript
import type { FilterFieldType } from './filter-field-type.enum';

/**
 * Generic filter field definition.
 * Supports multiple input types with type-safe value handling.
 *
 * @template TFilters - The shape of filter state
 */
export type FilterDefinition<TFilters> = {
  /** Filter field key (typed against TFilters) */
  key: keyof TFilters;

  /** Display label */
  label: string;

  /** Input type (search, select, date-range, etc.) */
  type: FilterFieldType;

  /** Placeholder text */
  placeholder?: string;

  /** Options for select-type filters */
  options?: Array<{
    label: string;
    value: string | number | boolean;
  }>;

  /** Debounce delay in ms (for search inputs) */
  debounceMs?: number;

  /** Default value */
  defaultValue?: TFilters[keyof TFilters];

  /** Custom render function */
  customRender?: (props: {
    value: TFilters[keyof TFilters];
    onChange: (value: TFilters[keyof TFilters]) => void;
    disabled?: boolean;
  }) => React.ReactNode;

  /** Badge label formatter (for active filters) */
  formatBadgeLabel?: (value: TFilters[keyof TFilters]) => string;
};
```

#### 4. Filter Field Type Enum

**File:** `/lib/types/table/filter-field-type.enum.ts`

```typescript
/**
 * Supported filter field types for generic filter rendering
 */
export const FilterFieldType = {
  SEARCH: 'search',
  SELECT: 'select',
  MULTI_SELECT: 'multi-select',
  DATE_RANGE: 'date-range',
  DATE: 'date',
  NUMBER_RANGE: 'number-range',
  BOOLEAN: 'boolean',
  CUSTOM: 'custom',
} as const;

export type FilterFieldType =
  (typeof FilterFieldType)[keyof typeof FilterFieldType];
```

#### 5. Action Definition Type

**File:** `/lib/types/table/action-definition.type.ts`

```typescript
import type { LucideIcon } from 'lucide-react';

/**
 * Row action definition for dropdown menus.
 *
 * @template TData - The shape of row data
 */
export type ActionDefinition<TData> = {
  /** Unique action identifier */
  id: string;

  /** Action label */
  label: string | ((row: TData) => string);

  /** Icon component */
  icon?: LucideIcon;

  /** Action handler */
  onClick: (row: TData) => void;

  /** Show separator after this action */
  separator?: boolean;

  /** Conditional visibility */
  show?: (row: TData) => boolean;

  /** Destructive styling (for delete actions) */
  variant?: 'default' | 'destructive' | 'success';

  /** Disable condition */
  disabled?: (row: TData) => boolean;
};
```

#### 6. Table Data Response Type

**File:** `/lib/types/table/table-data-response.type.ts`

```typescript
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
```

#### 7. Pagination Config Type

**File:** `/lib/types/table/pagination-config.type.ts`

```typescript
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
```

#### 8. Type Index Export

**File:** `/lib/types/table/index.ts`

```typescript
export * from './table-config.type';
export * from './column-definition.type';
export * from './filter-definition.type';
export * from './filter-field-type.enum';
export * from './action-definition.type';
export * from './table-data-response.type';
export * from './pagination-config.type';
```

---

## Implementation Phases

### Phase 1: Core Type Definitions & Shared Hooks

**Estimated Time:** 2-3 hours
**Complexity:** Medium
**Dependencies:** None

#### Tasks

1. **Create Type System**
   - [ ] Create `/lib/types/table/` directory
   - [ ] Implement all type files listed in [Type System Design](#type-system-design)
   - [ ] Add comprehensive JSDoc comments
   - [ ] Export all types from index.ts

2. **Create Shared Hooks**

   **File:** `/lib/hooks/table/use-debounced-callback.hook.ts`

   ```typescript
   import { useCallback, useEffect, useRef } from 'react';

   /**
    * Custom hook for debouncing callbacks with proper cleanup.
    * Prevents memory leaks by clearing timeout on unmount or dependency change.
    *
    * @template TArgs - Argument types for the callback
    * @param callback - The function to debounce
    * @param delay - Delay in milliseconds (default: 300)
    * @returns Debounced callback function
    */
   export function useDebouncedCallback<TArgs extends unknown[]>(
     callback: (...args: TArgs) => void,
     delay: number = 300
   ) {
     const timeoutRef = useRef<NodeJS.Timeout | null>(null);

     // Cleanup on unmount
     useEffect(() => {
       return () => {
         if (timeoutRef.current) {
           clearTimeout(timeoutRef.current);
         }
       };
     }, []);

     const debouncedCallback = useCallback(
       (...args: TArgs) => {
         if (timeoutRef.current) {
           clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = setTimeout(() => {
           callback(...args);
         }, delay);
       },
       [callback, delay]
     );

     return debouncedCallback;
   }
   ```

   **File:** `/lib/hooks/table/use-table-url-sync.hook.ts`

   ```typescript
   import { useRouter, useSearchParams } from 'next/navigation';
   import { useCallback } from 'react';

   /**
    * Custom hook for synchronizing table filters with URL parameters.
    * Handles URL updates without page reload and proper scroll behavior.
    *
    * @template TFilters - The shape of filter state
    */
   export function useTableUrlSync<TFilters extends Record<string, unknown>>() {
     const router = useRouter();
     const searchParams = useSearchParams();

     /**
      * Update URL with new filter values
      */
     const updateUrlParams = useCallback(
       (filters: Partial<TFilters>) => {
         const params = new URLSearchParams(searchParams.toString());

         Object.entries(filters).forEach(([key, value]) => {
           if (value === undefined || value === null || value === '') {
             params.delete(key);
           } else {
             params.set(key, String(value));
           }
         });

         router.push(`?${params.toString()}`, { scroll: false });
       },
       [router, searchParams]
     );

     /**
      * Get current filter values from URL
      */
     const getFiltersFromUrl = useCallback(<
       T extends Partial<TFilters>,
     >(): T => {
       const filters: Record<string, unknown> = {};

       searchParams.forEach((value, key) => {
         // Type conversion: try parsing as number, boolean, then string
         if (value === 'true') {
           filters[key] = true;
         } else if (value === 'false') {
           filters[key] = false;
         } else if (!isNaN(Number(value)) && value !== '') {
           filters[key] = Number(value);
         } else {
           filters[key] = value;
         }
       });

       return filters as T;
     }, [searchParams]);

     return { updateUrlParams, getFiltersFromUrl };
   }
   ```

3. **Validation**
   - [ ] Run `pnpm type-check` - must pass
   - [ ] Verify all exports in index.ts
   - [ ] Test type inference with sample data types

**Deliverables:**

- Complete type system in `/lib/types/table/`
- Two custom hooks in `/lib/hooks/table/`
- Zero TypeScript errors

---

### Phase 2: Generic Table Wrapper Component

**Estimated Time:** 3-4 hours
**Complexity:** High
**Dependencies:** Phase 1

#### Implementation

**File:** `/components/admin/generic/admin-table-wrapper.component.tsx`

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminTable } from './admin-table.component';
import { AdminTableFilters } from './admin-table-filters.component';
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
export function AdminTableWrapper<TData, TFilters extends Record<string, unknown>>({
  config,
  initialData,
  initialFilters,
}: AdminTableWrapperProps<TData, TFilters>) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

      if (isFilterChange) {
        updatedFilters.offset = 0 as TFilters['offset'];
      }

      setFilters(updatedFilters);
      setIsLoading(true);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else if (typeof value === 'boolean') {
          params.set(key, value.toString());
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });

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
        setData(newData);
      } catch (error) {
        console.error(`Failed to fetch ${config.tableId}:`, error);
        // TODO: Show error toast using sonner
      } finally {
        setIsLoading(false);
      }
    },
    [filters, router, searchParams, config]
  );

  /**
   * Handle pagination change
   */
  const handlePageChange = useCallback(
    (newOffset: number) => {
      updateFilters({ offset: newOffset } as Partial<TFilters>);
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
        offset: 0
      } as Partial<TFilters>);
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
        config={config}
        data={data.data}
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
```

#### Tasks

1. **Implement Generic Wrapper**
   - [ ] Create wrapper component with full generic support
   - [ ] Implement state management (data, filters, loading)
   - [ ] Add URL synchronization logic
   - [ ] Implement fetch logic with error handling
   - [ ] Add JSDoc documentation

2. **Validation**
   - [ ] Test type inference with UserTableData
   - [ ] Test type inference with OrganizationData
   - [ ] Verify URL sync works correctly
   - [ ] Test filter reset logic (offset → 0)

**Deliverables:**

- Generic wrapper component with full type safety
- URL synchronization working
- Filter/pagination state management

---

### Phase 3: Generic Table Renderer Component

**Estimated Time:** 4-5 hours
**Complexity:** High
**Dependencies:** Phase 1, Phase 2

#### Implementation

**File:** `/components/admin/generic/admin-table.component.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TablePagination } from '@/components/admin/shared/table-pagination.component';
import type { TableConfig, ActionDefinition } from '@/lib/types/table';

type AdminTableProps<TData> = {
  config: TableConfig<TData, unknown>;
  data: TData[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPageChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
};

/**
 * Generic admin table component using TanStack Table.
 * Renders any data type with configured columns and actions.
 *
 * @template TData - Shape of table row data
 */
export function AdminTable<TData>({
  config,
  data,
  total,
  limit,
  offset,
  isLoading = false,
  onPageChange,
  onLimitChange,
}: AdminTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Add actions column if actions are defined
  const columns = config.actions
    ? [
        ...config.columns,
        {
          id: 'actions',
          cell: ({ row }: { row: { original: TData } }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {config.actions?.map((action, index) => {
                  const shouldShow = action.show ? action.show(row.original) : true;
                  const isDisabled = action.disabled
                    ? action.disabled(row.original)
                    : false;
                  const label =
                    typeof action.label === 'function'
                      ? action.label(row.original)
                      : action.label;

                  if (!shouldShow) return null;

                  const menuItem = (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => action.onClick(row.original)}
                      disabled={isDisabled}
                      className={
                        action.variant === 'destructive'
                          ? 'text-destructive focus:text-destructive'
                          : action.variant === 'success'
                            ? 'text-success focus:text-success'
                            : ''
                      }
                    >
                      {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                      {label}
                    </DropdownMenuItem>
                  );

                  if (action.separator && index < config.actions!.length - 1) {
                    return (
                      <>
                        {menuItem}
                        <DropdownMenuSeparator />
                      </>
                    );
                  }

                  return menuItem;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
      ]
    : config.columns;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: config.skeletonRows || limit }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 w-full animate-pulse bg-muted rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    {config.emptyState?.icon && (
                      <config.emptyState.icon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <p className="font-medium">{config.emptyState?.title || 'No data found'}</p>
                    {config.emptyState?.description && (
                      <p className="text-sm text-muted-foreground">
                        {config.emptyState.description}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && data.length > 0 && (
        <TablePagination
          total={total}
          limit={limit}
          offset={offset}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          pageSizeOptions={config.pagination?.pageSizeOptions}
          showPageSizeSelector={config.pagination?.showPageSizeSelector}
        />
      )}
    </div>
  );
}
```

#### Tasks

1. **Implement Generic Table**
   - [ ] Create table component with TanStack Table
   - [ ] Implement dynamic column rendering
   - [ ] Add actions dropdown with conditional rendering
   - [ ] Implement loading skeletons
   - [ ] Add empty state rendering
   - [ ] Integrate TablePagination component

2. **Validation**
   - [ ] Test with different data types
   - [ ] Verify sorting works
   - [ ] Test action dropdown rendering
   - [ ] Verify loading states

**Deliverables:**

- Generic table renderer with full features
- Dynamic actions dropdown
- Loading and empty states

---

### Phase 4: Generic Filter Renderer Component

**Estimated Time:** 4-5 hours
**Complexity:** High
**Dependencies:** Phase 1, Phase 2

#### Implementation

**File:** `/components/admin/generic/admin-table-filters.component.tsx`

```typescript
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
import type { TableConfig, FilterFieldType } from '@/lib/types/table';

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
export function AdminTableFilters<TData, TFilters extends Record<string, unknown>>({
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
  const renderFilterField = (filterDef: typeof config.filters[0]) => {
    const { key, type, label, placeholder, options, customRender } = filterDef;

    // Custom render
    if (customRender) {
      return customRender({
        value: filters[key],
        onChange: (value) => onFiltersChange({ [key]: value } as Partial<TFilters>),
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
              <SelectItem key={String(option.value)} value={String(option.value)}>
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
          value={
            filters[key] === undefined
              ? 'all'
              : String(filters[key])
          }
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Loading {config.tableId}...
        </div>
      )}
    </div>
  );
}
```

#### Tasks

1. **Implement Generic Filters**
   - [ ] Create filter renderer component
   - [ ] Implement search input with debouncing
   - [ ] Add select input rendering
   - [ ] Add boolean filter support
   - [ ] Implement custom filter rendering
   - [ ] Add active filter badges
   - [ ] Add clear filters functionality

2. **Validation**
   - [ ] Test debounce cleanup on unmount
   - [ ] Test different filter types
   - [ ] Verify badge rendering
   - [ ] Test clear filters

**Deliverables:**

- Generic filter renderer component
- Support for multiple filter types
- Active filter badges with clear functionality

---

### Phase 5: User Table Migration

**Estimated Time:** 2-3 hours
**Complexity:** Medium
**Dependencies:** Phase 1-4

#### Implementation

**File:** `/components/admin/users/user-table-config.ts`

```typescript
import { Eye, Shield, Ban, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { TableConfig, FilterFieldType } from '@/lib/types/table';

/**
 * User table data type
 */
export type UserTableData = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
};

/**
 * User table filters type
 */
export type UserTableFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};

/**
 * User table configuration
 */
export const userTableConfig: TableConfig<UserTableData, UserTableFilters> = {
  tableId: 'users',
  apiEndpoint: '/api/admin/users',

  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.original.name}</div>
          {row.original.banned && (
            <Badge variant="destructive" className="text-xs">
              Banned
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role || 'user';
        const variant =
          role === 'super-admin'
            ? 'default'
            : role === 'admin'
              ? 'secondary'
              : 'outline';

        return (
          <Badge variant={variant} className="capitalize">
            {role === 'super-admin' && <Shield className="mr-1 h-3 w-3" />}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'emailVerified',
      header: 'Verified',
      cell: ({ row }) =>
        row.original.emailVerified ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </div>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: 'search' as FilterFieldType,
      placeholder: 'Search users by name or email...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select' as FilterFieldType,
      placeholder: 'All Roles',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super-admin' },
      ],
      formatBadgeLabel: (value) => `Role: ${value}`,
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('View details:', row.id);
      },
    },
    {
      id: 'update-role',
      label: 'Update Role',
      icon: Shield,
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('Update role:', row.id);
      },
      separator: true,
    },
    {
      id: 'ban-user',
      label: (row) => (row.banned ? 'Unban User' : 'Ban User'),
      icon: Ban,
      variant: (row) => (row.banned ? 'success' : 'destructive'),
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('Ban/unban user:', row.id);
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    title: 'No users found',
    description: 'Try adjusting your search or filter criteria',
  },

  skeletonRows: 10,
};
```

**File:** `/components/admin/users/user-table.component.tsx`

```typescript
'use client';

import { useState } from 'react';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { UserDetailsDialog } from './user-details-dialog.component';
import { UpdateRoleDialog } from './update-role-dialog.component';
import { BanUserDialog } from './ban-user-dialog.component';
import { userTableConfig, type UserTableData, type UserTableFilters } from './user-table-config';
import type { TableDataResponse } from '@/lib/types/table';

type UserTableProps = {
  initialData: TableDataResponse<UserTableData>;
  initialFilters: UserTableFilters;
};

/**
 * User table component with dialogs.
 * Wraps generic AdminTableWrapper with user-specific dialogs.
 */
export function UserTable({ initialData, initialFilters }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserTableData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  // Enhance config with dialog handlers
  const configWithDialogs = {
    ...userTableConfig,
    actions: userTableConfig.actions?.map((action) => ({
      ...action,
      onClick: (row: UserTableData) => {
        setSelectedUser(row);
        if (action.id === 'view-details') setDetailsOpen(true);
        if (action.id === 'update-role') setRoleDialogOpen(true);
        if (action.id === 'ban-user') setBanDialogOpen(true);
      },
    })),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithDialogs}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserDetailsDialog
            user={{ ...selectedUser, banned: selectedUser.banned ?? false }}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <UpdateRoleDialog
            user={selectedUser}
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
          />
          <BanUserDialog
            user={{ ...selectedUser, banned: selectedUser.banned ?? false }}
            open={banDialogOpen}
            onOpenChange={setBanDialogOpen}
          />
        </>
      )}
    </>
  );
}
```

#### Tasks

1. **Create User Table Config**
   - [ ] Define UserTableData type
   - [ ] Define UserTableFilters type
   - [ ] Create column definitions
   - [ ] Create filter definitions
   - [ ] Create action definitions
   - [ ] Configure pagination and empty state

2. **Create User Table Component**
   - [ ] Implement dialog state management
   - [ ] Wrap AdminTableWrapper with dialogs
   - [ ] Connect action handlers to dialogs

3. **Update Page Integration**
   - [ ] Update user admin page to use new UserTable
   - [ ] Test data fetching and rendering
   - [ ] Verify all features work

4. **Delete Old Files**
   - [ ] Delete `user-table-wrapper.component.tsx`
   - [ ] Delete `user-table-client.component.tsx`
   - [ ] Delete `user-filters.component.tsx`

**Deliverables:**

- User table fully migrated to generic system
- All existing features preserved
- Old files removed

---

### Phase 6: Organization Table Migration

**Estimated Time:** 2-3 hours
**Complexity:** Medium
**Dependencies:** Phase 1-5

#### Implementation

**File:** `/components/admin/organizations/organization-table-config.ts`

```typescript
import { Building2, Eye, ExternalLink, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TableConfig, FilterFieldType } from '@/lib/types/table';

/**
 * Organization table data type
 */
export type OrganizationTableData = {
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

/**
 * Organization table filters type
 */
export type OrganizationTableFilters = {
  search?: string;
  subscriptionStatus?: string;
  hasSubscription?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * Get subscription status badge variant
 */
function getSubscriptionStatusVariant(status: string) {
  switch (status) {
    case 'active':
      return 'default';
    case 'trialing':
      return 'secondary';
    case 'canceled':
    case 'past_due':
    case 'unpaid':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Organization table configuration
 */
export const organizationTableConfig: TableConfig<
  OrganizationTableData,
  OrganizationTableFilters
> = {
  tableId: 'organizations',
  apiEndpoint: '/api/admin/organizations',

  columns: [
    {
      accessorKey: 'name',
      header: 'Organization',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={row.original.logo || undefined} alt={row.original.name} />
            <AvatarFallback>
              {row.original.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">
              /{row.original.slug || 'no-slug'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'memberCount',
      header: 'Members',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.memberCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Subscription',
      cell: ({ row }) => {
        if (row.original.stripeSubscriptionId && row.original.subscriptionStatus) {
          return (
            <Badge
              variant={getSubscriptionStatusVariant(row.original.subscriptionStatus)}
            >
              {row.original.subscriptionStatus}
            </Badge>
          );
        }
        return <Badge variant="outline">No subscription</Badge>;
      },
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }) =>
        row.original.planName ? (
          <span className="text-sm font-medium">{row.original.planName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: 'search' as FilterFieldType,
      placeholder: 'Search organizations by name or slug...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'subscriptionStatus',
      label: 'Subscription Status',
      type: 'select' as FilterFieldType,
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Trial', value: 'trialing' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
      formatBadgeLabel: (value) => `Status: ${value}`,
    },
    {
      key: 'hasSubscription',
      label: 'Subscription',
      type: 'boolean' as FilterFieldType,
      placeholder: 'All Organizations',
      formatBadgeLabel: (value) =>
        value ? 'With Subscription' : 'No Subscription',
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        console.log('View details:', row.id);
      },
    },
    {
      id: 'view-in-app',
      label: 'View in App',
      icon: ExternalLink,
      onClick: (row) => {
        window.open(`/app?org=${row.slug || row.id}`, '_blank');
      },
      separator: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: async (row) => {
        if (
          !confirm(
            `Are you sure you want to delete "${row.name}"? This action cannot be undone.`
          )
        ) {
          return;
        }

        try {
          const response = await fetch(`/api/admin/organizations/${row.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete organization');
          }

          window.location.reload();
        } catch (error) {
          console.error('Failed to delete organization:', error);
          alert('Failed to delete organization. Please try again.');
        }
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: Building2,
    title: 'No organizations found',
    description: 'Try adjusting your search or filter criteria',
  },

  skeletonRows: 10,
};
```

**File:** `/components/admin/organizations/organization-table.component.tsx`

```typescript
'use client';

import { useState } from 'react';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { OrganizationDetailsDialog } from './organization-details-dialog.component';
import {
  organizationTableConfig,
  type OrganizationTableData,
  type OrganizationTableFilters,
} from './organization-table-config';
import type { TableDataResponse } from '@/lib/types/table';

type OrganizationTableProps = {
  initialData: TableDataResponse<OrganizationTableData>;
  initialFilters: OrganizationTableFilters;
};

/**
 * Organization table component with dialogs.
 * Wraps generic AdminTableWrapper with organization-specific dialogs.
 */
export function OrganizationTable({
  initialData,
  initialFilters,
}: OrganizationTableProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    null
  );

  // Enhance config with dialog handler
  const configWithDialogs = {
    ...organizationTableConfig,
    actions: organizationTableConfig.actions?.map((action) => {
      if (action.id === 'view-details') {
        return {
          ...action,
          onClick: (row: OrganizationTableData) => {
            setSelectedOrganizationId(row.id);
          },
        };
      }
      return action;
    }),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithDialogs}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Organization Details Dialog */}
      {selectedOrganizationId && (
        <OrganizationDetailsDialog
          organizationId={selectedOrganizationId}
          open={!!selectedOrganizationId}
          onClose={() => setSelectedOrganizationId(null)}
        />
      )}
    </>
  );
}
```

#### Tasks

1. **Create Organization Table Config**
   - [ ] Define OrganizationTableData type
   - [ ] Define OrganizationTableFilters type
   - [ ] Create column definitions
   - [ ] Create filter definitions
   - [ ] Create action definitions (including delete)
   - [ ] Configure pagination and empty state

2. **Create Organization Table Component**
   - [ ] Implement dialog state management
   - [ ] Wrap AdminTableWrapper with dialogs
   - [ ] Connect action handlers

3. **Update Page Integration**
   - [ ] Update organization admin page
   - [ ] Test data fetching and rendering
   - [ ] Verify all features work

4. **Delete Old Files**
   - [ ] Delete `organization-table-client.component.tsx`
   - [ ] Delete `organization-table.component.tsx` (old one)
   - [ ] Delete `organization-filters.component.tsx`

**Deliverables:**

- Organization table fully migrated
- All existing features preserved
- Old files removed

---

### Phase 7: Unit Testing

**Estimated Time:** 6-8 hours
**Complexity:** Medium
**Dependencies:** Phase 1-6

#### Testing Strategy

**Test Framework:** Vitest (already configured in project)

**Test Coverage Requirements:**

- Minimum 80% coverage for new code
- Test all generic components
- Test type inference
- Test edge cases

#### Test Files to Create

1. **Type System Tests**

   **File:** `/lib/types/table/__tests__/table-config.test.ts`

   ```typescript
   import { describe, it, expect } from 'vitest';
   import type { TableConfig } from '../table-config.type';

   type TestData = { id: string; name: string };
   type TestFilters = { search?: string };

   describe('TableConfig Type', () => {
     it('should enforce correct config structure', () => {
       const config: TableConfig<TestData, TestFilters> = {
         tableId: 'test',
         apiEndpoint: '/api/test',
         columns: [
           {
             accessorKey: 'name',
             header: 'Name',
           },
         ],
         filters: [
           {
             key: 'search',
             label: 'Search',
             type: 'search',
           },
         ],
       };

       expect(config.tableId).toBe('test');
     });
   });
   ```

2. **Hook Tests**

   **File:** `/lib/hooks/table/__tests__/use-debounced-callback.test.ts`

   ```typescript
   import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
   import { renderHook, act } from '@testing-library/react';
   import { useDebouncedCallback } from '../use-debounced-callback.hook';

   describe('useDebouncedCallback', () => {
     beforeEach(() => {
       vi.useFakeTimers();
     });

     afterEach(() => {
       vi.restoreAllMocks();
     });

     it('should debounce callback execution', () => {
       const callback = vi.fn();
       const { result } = renderHook(() => useDebouncedCallback(callback, 300));

       act(() => {
         result.current('test1');
         result.current('test2');
         result.current('test3');
       });

       expect(callback).not.toHaveBeenCalled();

       act(() => {
         vi.advanceTimersByTime(300);
       });

       expect(callback).toHaveBeenCalledTimes(1);
       expect(callback).toHaveBeenCalledWith('test3');
     });

     it('should cleanup timeout on unmount', () => {
       const callback = vi.fn();
       const { result, unmount } = renderHook(() =>
         useDebouncedCallback(callback, 300)
       );

       act(() => {
         result.current('test');
       });

       unmount();

       act(() => {
         vi.advanceTimersByTime(300);
       });

       expect(callback).not.toHaveBeenCalled();
     });
   });
   ```

3. **Component Tests**

   **File:** `/components/admin/generic/__tests__/admin-table-filters.test.tsx`

   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { AdminTableFilters } from '../admin-table-filters.component';
   import type { TableConfig } from '@/lib/types/table';

   const mockConfig: TableConfig<{ id: string }, { search?: string }> = {
     tableId: 'test',
     apiEndpoint: '/api/test',
     columns: [],
     filters: [
       {
         key: 'search',
         label: 'Search',
         type: 'search',
         placeholder: 'Search test...',
       },
     ],
   };

   describe('AdminTableFilters', () => {
     it('should render search input', () => {
       render(
         <AdminTableFilters
           config={mockConfig}
           filters={{}}
           onFiltersChange={vi.fn()}
         />
       );

       expect(screen.getByPlaceholderText('Search test...')).toBeInTheDocument();
     });

     it('should debounce search input', async () => {
       const onFiltersChange = vi.fn();

       render(
         <AdminTableFilters
           config={mockConfig}
           filters={{}}
           onFiltersChange={onFiltersChange}
         />
       );

       const input = screen.getByPlaceholderText('Search test...');

       fireEvent.change(input, { target: { value: 'test query' } });

       expect(onFiltersChange).not.toHaveBeenCalled();

       await waitFor(
         () => {
           expect(onFiltersChange).toHaveBeenCalledWith({ search: 'test query' });
         },
         { timeout: 400 }
       );
     });

     it('should show active filter badges', () => {
       render(
         <AdminTableFilters
           config={mockConfig}
           filters={{ search: 'test' }}
           onFiltersChange={vi.fn()}
         />
       );

       expect(screen.getByText(/Search: test/i)).toBeInTheDocument();
     });
   });
   ```

#### Tasks

1. **Create Test Infrastructure**
   - [ ] Set up test utilities
   - [ ] Create mock data generators
   - [ ] Configure test environment

2. **Write Unit Tests**
   - [ ] Type system tests (type inference validation)
   - [ ] Hook tests (debounce, URL sync)
   - [ ] Generic component tests
   - [ ] User table config tests
   - [ ] Organization table config tests

3. **Run Tests & Coverage**
   - [ ] Run `pnpm test`
   - [ ] Run `pnpm test:coverage`
   - [ ] Ensure >80% coverage
   - [ ] Fix any failing tests

**Deliverables:**

- Comprehensive test suite
- > 80% code coverage
- All tests passing

**Reference:** Leverage the `unit-testing` agent for expert guidance on testing patterns.

---

### Phase 8: Documentation

**Estimated Time:** 4-5 hours
**Complexity:** Low
**Dependencies:** Phase 1-7

#### Documentation to Create

1. **Technical Documentation**

   **File:** `/docs/technical/generic-admin-table-system.md`

   ```markdown
   # Generic Admin Table System

   ## Overview

   The Generic Admin Table System provides a type-safe, reusable framework for building
   admin tables with filtering, pagination, sorting, and actions.

   ## Architecture

   [Architecture diagram and component hierarchy]

   ## Type System

   [Detailed type documentation with examples]

   ## Components

   ### AdminTableWrapper

   [Complete API documentation]

   ### AdminTable

   [Complete API documentation]

   ### AdminTableFilters

   [Complete API documentation]

   ## Usage Examples

   [Multiple real-world examples]
   ```

2. **Developer Guide**

   **File:** `/docs/guides/creating-admin-tables.md`

   ```markdown
   # Creating a New Admin Table

   ## Step-by-Step Guide

   This guide walks you through creating a new admin table from scratch.

   ### Step 1: Define Data Types

   [Code example with full TypeScript types]

   ### Step 2: Create Table Configuration

   [Code example of table config]

   ### Step 3: Create Table Component

   [Code example of wrapper component]

   ### Step 4: Integrate with Page

   [Code example of page integration]

   ## Advanced Features

   [Custom filters, custom actions, etc.]
   ```

3. **API Reference**

   **File:** `/docs/api-reference/admin-table-api.md`

   ```markdown
   # Admin Table API Reference

   ## Types

   ### TableConfig<TData, TFilters>

   [Complete type documentation with all properties]

   ### ColumnDefinition<TData>

   [Complete type documentation]

   [... all other types ...]

   ## Components

   [Complete component API documentation]

   ## Hooks

   [Complete hook API documentation]
   ```

4. **Migration Guide**

   **File:** `/docs/migration/to-generic-table-system.md`

   ```markdown
   # Migration to Generic Table System

   ## Overview

   This guide helps you migrate existing custom tables to the generic system.

   ## Before Migration

   [Checklist of things to verify]

   ## Migration Steps

   [Step-by-step migration process]

   ## Troubleshooting

   [Common issues and solutions]
   ```

5. **Update Main Documentation Index**

   **File:** `/docs/index.md`

   Add links to new documentation in the appropriate sections.

#### Tasks

1. **Write Technical Documentation**
   - [ ] Create architecture documentation
   - [ ] Document type system
   - [ ] Document all components
   - [ ] Add code examples

2. **Write Developer Guides**
   - [ ] Create step-by-step guide for new tables
   - [ ] Add advanced usage examples
   - [ ] Document best practices

3. **Create API Reference**
   - [ ] Document all types
   - [ ] Document all components
   - [ ] Document all hooks
   - [ ] Add usage examples for each API

4. **Write Migration Guide**
   - [ ] Document migration steps
   - [ ] Add before/after examples
   - [ ] Create troubleshooting section

5. **Update Main Docs**
   - [ ] Add navigation links
   - [ ] Update table of contents
   - [ ] Cross-reference related docs

**Deliverables:**

- Complete technical documentation
- Developer guide with examples
- API reference documentation
- Migration guide

**Reference:** Leverage the `documentation-writer` agent for expert guidance on documentation structure.

---

## Code Examples

### Example 1: Complete User Table Implementation

```typescript
// user-table-config.ts
import type { TableConfig } from '@/lib/types/table';

export type UserTableData = {
  id: string;
  name: string;
  email: string;
};

export type UserTableFilters = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const userTableConfig: TableConfig<UserTableData, UserTableFilters> = {
  tableId: 'users',
  apiEndpoint: '/api/admin/users',
  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      ),
    },
  ],
  filters: [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search users...',
    },
  ],
  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },
};
```

### Example 2: Creating a New Table (Products)

```typescript
// Step 1: Define types
export type ProductTableData = {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  createdAt: Date;
};

export type ProductTableFilters = {
  search?: string;
  category?: string;
  inStock?: boolean;
  limit?: number;
  offset?: number;
};

// Step 2: Create config
export const productTableConfig: TableConfig<ProductTableData, ProductTableFilters> = {
  tableId: 'products',
  apiEndpoint: '/api/admin/products',

  columns: [
    {
      accessorKey: 'name',
      header: 'Product Name',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'inStock',
      header: 'In Stock',
      cell: ({ row }) => (
        <Badge variant={row.original.inStock ? 'default' : 'outline'}>
          {row.original.inStock ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search products...',
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Books', value: 'books' },
      ],
    },
    {
      key: 'inStock',
      label: 'Availability',
      type: 'boolean',
    },
  ],

  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: (row) => {
        // Handle edit
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (row) => {
        // Handle delete
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },
};

// Step 3: Create component
export function ProductTable({ initialData, initialFilters }) {
  return (
    <AdminTableWrapper
      config={productTableConfig}
      initialData={initialData}
      initialFilters={initialFilters}
    />
  );
}
```

### Example 3: Custom Filter with Date Range

```typescript
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const ordersTableConfig: TableConfig<OrderTableData, OrderTableFilters> = {
  // ... other config

  filters: [
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'custom',
      customRender: ({ value, onChange, disabled }) => {
        const [date, setDate] = useState<DateRange | undefined>(value);

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={disabled}>
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} -{' '}
                      {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(range) => {
                  setDate(range);
                  onChange(range);
                }}
              />
            </PopoverContent>
          </Popover>
        );
      },
    },
  ],
};
```

---

## Migration Strategy

### Pre-Migration Checklist

- [ ] All team members briefed on new system
- [ ] Documentation reviewed and understood
- [ ] Test environment prepared
- [ ] Backup of current implementation created

### Migration Steps

#### Step 1: Implement Generic System (Phases 1-4)

- Complete all generic components
- Test thoroughly in isolation
- Ensure type safety

#### Step 2: Parallel Implementation

- Implement new User table alongside old one
- Compare behavior side-by-side
- Fix any discrepancies

#### Step 3: Gradual Rollout

1. **Week 1:** User table migration
   - Deploy to staging
   - QA testing
   - Monitor for issues

2. **Week 2:** Organization table migration
   - Deploy to staging
   - QA testing
   - Monitor for issues

3. **Week 3:** Production deployment
   - Deploy User table to production
   - Monitor for 2-3 days
   - Deploy Organization table to production

#### Step 4: Cleanup

- Remove old components
- Update imports
- Remove unused dependencies
- Update documentation

### Rollback Plan

If issues are discovered:

1. **Immediate Rollback:**

   ```bash
   git revert <commit-hash>
   pnpm build && pnpm start
   ```

2. **Partial Rollback:**
   - Keep generic system
   - Revert specific table only
   - Fix issues
   - Re-deploy

### Testing at Each Step

1. **Unit Tests:** All tests must pass
2. **Integration Tests:** Test table interactions
3. **E2E Tests:** Test complete user flows
4. **Manual QA:** Test all features manually
5. **Performance Tests:** Ensure no performance regression

---

## Testing & Validation

### Test Scenarios

#### Functional Tests

1. **Pagination**
   - [ ] Navigate to next page
   - [ ] Navigate to previous page
   - [ ] Change page size
   - [ ] Verify offset updates in URL

2. **Filtering**
   - [ ] Search filter debounces correctly
   - [ ] Select filter updates immediately
   - [ ] Boolean filter toggles correctly
   - [ ] Clear filters resets all
   - [ ] Active badges show/hide correctly

3. **Sorting**
   - [ ] Click column header to sort
   - [ ] Sort ascending
   - [ ] Sort descending
   - [ ] Multi-column sort

4. **Actions**
   - [ ] View details opens dialog
   - [ ] Edit opens dialog
   - [ ] Delete confirms and executes
   - [ ] Conditional actions show/hide

5. **URL Sync**
   - [ ] URL updates on filter change
   - [ ] URL updates on pagination
   - [ ] Browser back button works
   - [ ] Direct URL navigation works
   - [ ] No page scroll on update

#### Edge Cases

1. **Empty States**
   - [ ] No data shows empty state
   - [ ] No results from search shows empty state
   - [ ] Custom empty state renders correctly

2. **Loading States**
   - [ ] Skeleton shows on initial load
   - [ ] Skeleton shows on filter change
   - [ ] Loading indicator shows in filters
   - [ ] Pagination disabled during loading

3. **Error Handling**
   - [ ] API error shows error message
   - [ ] Network error handled gracefully
   - [ ] Invalid data handled correctly

4. **Performance**
   - [ ] Large datasets (1000+ rows) render quickly
   - [ ] Debounce prevents excessive API calls
   - [ ] No memory leaks on unmount
   - [ ] Re-renders minimized

### Validation Checklist

**Type Safety:**

- [ ] No `any` types used
- [ ] Full type inference working
- [ ] Generic constraints enforced
- [ ] `pnpm type-check` passes

**Code Quality:**

- [ ] All files follow naming conventions
- [ ] JSDoc comments on all exports
- [ ] DRY principles applied
- [ ] No code duplication

**Accessibility:**

- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus management correct
- [ ] ARIA labels present

**Browser Compatibility:**

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Responsive Design:**

- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Filters stack on mobile

---

## Risk Assessment

### High Priority Risks

| Risk                                        | Impact | Probability | Mitigation                                                                |
| ------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------- |
| Type inference issues with complex generics | High   | Medium      | Extensive testing with different data types; add type utilities if needed |
| Performance degradation with large datasets | High   | Low         | Virtualization support; lazy loading; performance benchmarking            |
| Breaking existing functionality             | High   | Low         | Parallel implementation; thorough testing; gradual rollout                |

### Medium Priority Risks

| Risk                                    | Impact | Probability | Mitigation                                                |
| --------------------------------------- | ------ | ----------- | --------------------------------------------------------- |
| URL sync conflicts with browser history | Medium | Medium      | Use `scroll: false`; test browser navigation extensively  |
| Debounce cleanup not working            | Medium | Low         | Proper useEffect cleanup; unit tests for cleanup          |
| Filter state bugs with complex filters  | Medium | Medium      | Comprehensive state testing; type-safe filter definitions |

### Low Priority Risks

| Risk                    | Impact | Probability | Mitigation                                                   |
| ----------------------- | ------ | ----------- | ------------------------------------------------------------ |
| Documentation outdated  | Low    | Medium      | Version control for docs; update process in CI/CD            |
| Learning curve for team | Low    | High        | Comprehensive documentation; code examples; pair programming |

### Mitigation Strategies

1. **Extensive Testing**
   - Unit tests for all components
   - Integration tests for workflows
   - E2E tests for critical paths

2. **Gradual Rollout**
   - Deploy to staging first
   - One table at a time
   - Monitor metrics closely

3. **Documentation**
   - Comprehensive API docs
   - Step-by-step guides
   - Real-world examples

4. **Team Training**
   - Code walkthrough sessions
   - Pair programming
   - Internal knowledge base

---

## Success Metrics

### Quantitative Metrics

1. **Code Reduction**
   - Target: 70% reduction in table-related code
   - Measure: Lines of code before vs. after
   - Success: <300 lines total (excluding config)

2. **Development Speed**
   - Target: New table in <2 hours
   - Measure: Time to implement complete table
   - Success: <100 lines of config per table

3. **Performance**
   - Target: No performance degradation
   - Measure: Table render time, API call count
   - Success: ≤ current performance

4. **Test Coverage**
   - Target: >80% coverage
   - Measure: Vitest coverage report
   - Success: All critical paths covered

### Qualitative Metrics

1. **Developer Experience**
   - Easy to understand
   - Easy to extend
   - Good error messages
   - Type inference works

2. **User Experience**
   - Consistent across tables
   - Smooth interactions
   - Fast response times
   - Intuitive filtering

3. **Maintainability**
   - Easy to debug
   - Easy to modify
   - Well documented
   - Clear architecture

### Success Criteria

- [ ] All existing features preserved
- [ ] Zero TypeScript errors
- [ ] All tests passing (>80% coverage)
- [ ] Documentation complete
- [ ] Team trained and onboarded
- [ ] Production deployment successful
- [ ] No performance regression
- [ ] Positive team feedback

---

## References

### Official Documentation

1. **TanStack Table v8**
   - Main Docs: https://tanstack.com/table/v8/docs/guide/data
   - API Reference: https://tanstack.com/table/v8/docs/api/core/table
   - TypeScript Guide: https://tanstack.com/table/v8/docs/guide/tables

2. **Next.js 15**
   - useSearchParams: https://nextjs.org/docs/app/api-reference/functions/use-search-params
   - Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
   - Client Components: https://nextjs.org/docs/app/building-your-application/rendering/client-components

3. **TypeScript**
   - Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html
   - Utility Types: https://www.typescriptlang.org/docs/handbook/utility-types.html
   - Type Inference: https://www.typescriptlang.org/docs/handbook/type-inference.html

4. **React Hooks**
   - useCallback: https://react.dev/reference/react/useCallback
   - useEffect: https://react.dev/reference/react/useEffect
   - Custom Hooks: https://react.dev/learn/reusing-logic-with-custom-hooks

### Best Practices Articles

1. **TanStack Table Generic Implementation**
   - Contentful Guide: https://www.contentful.com/blog/tanstack-table-react-table/
   - LogRocket Tutorial: https://blog.logrocket.com/tanstack-table-formerly-react-table/
   - Material React Table: https://www.material-react-table.com/docs/guides/best-practices

2. **React Debounce Patterns**
   - LogRocket: https://blog.logrocket.com/url-state-usesearchparams/
   - OpenReplay: https://blog.openreplay.com/optimizing-api-calls-react-debounce-strategies/

3. **TypeScript Generic Patterns**
   - Advanced Patterns: https://dev.to/frontendtoolstech/typescript-advanced-patterns-writing-cleaner-safer-code-in-2025-4gbn
   - Generic Components: https://chrisfrew.in/blog/react-typescript-generic-search-sort-and-filters/

### Internal Resources

1. **Project Documentation**
   - CLAUDE.md: `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/CLAUDE.md`
   - Environment Config: `/docs/environment-configuration.md`

2. **Existing Implementations**
   - User Table: `/components/admin/users/`
   - Organization Table: `/components/admin/organizations/`
   - Shared Pagination: `/components/admin/shared/table-pagination.component.tsx`

3. **Type Definitions**
   - Admin Types: `/lib/types/admin/`
   - Pagination Types: `/lib/types/notifications/pagination.type.ts`

---

## Appendix

### File Naming Reference

Following project conventions from CLAUDE.md:

- `*.type.ts` - Type definitions
- `*.schema.ts` - Zod validation schemas
- `*.enum.ts` - Enum definitions
- `*.constant.ts` - Constant values
- `*.hook.ts` - Custom React hooks
- `*.component.tsx` - React components
- `*.config.ts` - Configuration files
- `*.test.ts` - Unit tests

### Design Token Reference

From `app/globals.css`:

**Colors:**

- `bg-card`, `bg-muted`, `bg-accent`
- `text-foreground`, `text-muted-foreground`
- `border`, `border-input`

**Spacing:**

- `p-6` (card padding)
- `gap-6` (section gap)
- `space-y-4`, `space-y-6`

**Radius:**

- `rounded-md` (6px default)
- `rounded-lg` (8px cards)
- `rounded-full` (circular)

### Quick Command Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production

# Testing
pnpm test                   # Run tests
pnpm test:coverage          # Run with coverage
pnpm type-check             # TypeScript check

# Database
pnpm db:studio              # Open Drizzle Studio

# Code Quality
pnpm lint                   # Check formatting
pnpm lint:fix               # Fix formatting
```

---

## Timeline Summary

| Phase                       | Duration  | Dependencies | Deliverables          |
| --------------------------- | --------- | ------------ | --------------------- |
| Phase 1: Core Types & Hooks | 2-3 hours | None         | Type system, hooks    |
| Phase 2: Generic Wrapper    | 3-4 hours | Phase 1      | AdminTableWrapper     |
| Phase 3: Generic Table      | 4-5 hours | Phase 1-2    | AdminTable            |
| Phase 4: Generic Filters    | 4-5 hours | Phase 1-2    | AdminTableFilters     |
| Phase 5: User Migration     | 2-3 hours | Phase 1-4    | User table refactored |
| Phase 6: Org Migration      | 2-3 hours | Phase 1-5    | Org table refactored  |
| Phase 7: Unit Testing       | 6-8 hours | Phase 1-6    | Test suite, coverage  |
| Phase 8: Documentation      | 4-5 hours | Phase 1-7    | Complete docs         |

**Total Estimated Time:** 28-36 hours (3.5-4.5 days)

---

## Next Steps

1. **Review this plan** with the development team
2. **Set up project tracking** (create tasks in project management tool)
3. **Assign phases** to developers
4. **Schedule kickoff meeting** to discuss architecture
5. **Begin Phase 1** implementation
6. **Daily standups** to track progress
7. **Code reviews** after each phase
8. **Final review** before production deployment

---

**Document Version:** 1.0
**Last Updated:** October 5, 2025
**Status:** Ready for Implementation
**Approval Required:** Yes

---

_This implementation plan was generated by Claude (Senior Software Architect) based on thorough analysis of the existing codebase, industry best practices, and project requirements._
