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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TablePagination } from '@/components/admin/shared/table-pagination.component';
import type { TableConfig } from '@/lib/types/table';
import { useAdminAccess } from '@/components/admin/shared/admin-access.provider';

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
/**
 * Action menu item component with permission awareness and tooltips.
 */
function ActionMenuItem<TData>({
  action,
  row,
  index,
  actionsLength,
  hasPermission,
}: {
  action: NonNullable<TableConfig<TData, unknown>['actions']>[number];
  row: TData;
  index: number;
  actionsLength: number;
  hasPermission: boolean;
}) {
  const shouldShow = action.show ? action.show(row) : true;
  const isDisabledByCondition = action.disabled ? action.disabled(row) : false;
  const isDisabledByPermission = action.requiredPermission && !hasPermission;
  const isDisabled = isDisabledByCondition || isDisabledByPermission;

  const label =
    typeof action.label === 'function' ? action.label(row) : action.label;
  const variant =
    typeof action.variant === 'function' ? action.variant(row) : action.variant;

  if (!shouldShow) return null;

  const menuItem = (
    <DropdownMenuItem
      key={action.id}
      onClick={() => !isDisabled && action.onClick(row)}
      disabled={isDisabled}
      className={
        variant === 'destructive'
          ? 'text-destructive focus:text-destructive'
          : variant === 'success'
            ? 'text-success focus:text-success'
            : ''
      }
    >
      {action.icon && <action.icon className="mr-2 h-4 w-4" />}
      {label}
    </DropdownMenuItem>
  );

  const itemWithSeparator =
    action.separator && index < actionsLength - 1 ? (
      <React.Fragment key={action.id}>
        {menuItem}
        <DropdownMenuSeparator />
      </React.Fragment>
    ) : (
      menuItem
    );

  // Wrap in tooltip if disabled due to permission
  if (isDisabledByPermission && action.permissionTooltip) {
    return (
      <Tooltip key={action.id}>
        <TooltipTrigger asChild>{itemWithSeparator}</TooltipTrigger>
        <TooltipContent>
          <p>{action.permissionTooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return itemWithSeparator;
}

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
  const { permissions } = useAdminAccess();

  // Add actions column if actions are defined (memoized to prevent re-renders)
  const columns = useMemo(
    () =>
      config.actions
        ? [
            ...config.columns,
            {
              id: 'actions',
              cell: ({ row }: { row: { original: TData } }) => (
                <TooltipProvider>
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
                      {config.actions?.map((action, index) => (
                        <ActionMenuItem
                          key={action.id}
                          action={action}
                          row={row.original}
                          index={index}
                          actionsLength={config.actions!.length}
                          hasPermission={
                            !action.requiredPermission ||
                            permissions.includes(action.requiredPermission)
                          }
                        />
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipProvider>
              ),
            },
          ]
        : config.columns,
    [config.actions, config.columns, permissions]
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
          showPageSizeSelector={config.pagination?.showPageSizeSelector}
        />
      )}
    </div>
  );
}
