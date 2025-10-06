'use client';

import React, { useState, useMemo } from 'react';
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
import type { TableConfig } from '@/lib/types/table';

type AdminTableProps<TData> = {
  config: TableConfig<TData, unknown>;
  data: TData[] | undefined;
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

  // Add actions column if actions are defined (memoized to prevent re-renders)
  const columns = useMemo(
    () =>
      config.actions
        ? [
            ...config.columns,
            {
              id: 'actions',
              cell: ({ row }: { row: { original: TData } }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      aria-label="Open actions menu"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {config.actions?.map((action, index) => {
                      const shouldShow = action.show
                        ? action.show(row.original)
                        : true;
                      const isDisabled = action.disabled
                        ? action.disabled(row.original)
                        : false;
                      const label =
                        typeof action.label === 'function'
                          ? action.label(row.original)
                          : action.label;
                      const variant =
                        typeof action.variant === 'function'
                          ? action.variant(row.original)
                          : action.variant;

                      if (!shouldShow) return null;

                      const menuItem = (
                        <DropdownMenuItem
                          key={action.id}
                          onClick={() => action.onClick(row.original)}
                          disabled={isDisabled}
                          className={
                            variant === 'destructive'
                              ? 'text-destructive focus:text-destructive'
                              : variant === 'success'
                                ? 'text-success focus:text-success'
                                : ''
                          }
                        >
                          {action.icon && (
                            <action.icon className="mr-2 h-4 w-4" />
                          )}
                          {label}
                        </DropdownMenuItem>
                      );

                      if (
                        action.separator &&
                        index < config.actions!.length - 1
                      ) {
                        return (
                          <React.Fragment key={action.id}>
                            {menuItem}
                            <DropdownMenuSeparator />
                          </React.Fragment>
                        );
                      }

                      return menuItem;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]
        : config.columns,
    [config.actions, config.columns]
  );

  const table = useReactTable({
    data: data || [],
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
              Array.from({ length: config.skeletonRows || limit }).map(
                (_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : data && data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
                    <p className="font-medium">
                      {config.emptyState?.title || 'No data found'}
                    </p>
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
      {!isLoading && data && data.length > 0 && (
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
