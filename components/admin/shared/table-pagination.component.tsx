'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TablePaginationProps = {
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPageChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
};

/**
 * Shared table pagination component for admin tables.
 * Provides pagination controls and optional page size selector.
 */
export function TablePagination({
  total,
  limit,
  offset,
  isLoading = false,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
}: TablePaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = offset + limit < total;
  const hasPrevPage = offset > 0;

  const startItem = total === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, total);

  /**
   * Handle page size change
   */
  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    onLimitChange(newLimit);
  };

  /**
   * Handle previous page
   */
  const handlePrevious = () => {
    if (hasPrevPage) {
      onPageChange(Math.max(0, offset - limit));
    }
  };

  /**
   * Handle next page
   */
  const handleNext = () => {
    if (hasNextPage) {
      onPageChange(offset + limit);
    }
  };

  /**
   * Handle first page
   */
  const handleFirst = () => {
    onPageChange(0);
  };

  /**
   * Handle last page
   */
  const handleLast = () => {
    const lastPageOffset = Math.floor((total - 1) / limit) * limit;
    onPageChange(lastPageOffset);
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-2">
      {/* Results info and page size selector */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div>
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
          {total.toLocaleString()} results
        </div>

        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={limit.toString()}
              onValueChange={handleLimitChange}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFirst}
          disabled={!hasPrevPage || isLoading}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to first page</span>
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -ml-2" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevPage || isLoading}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page info */}
        <div className="flex items-center gap-1 text-sm font-medium min-w-[100px] justify-center">
          Page {currentPage} of {totalPages}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNextPage || isLoading}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLast}
          disabled={!hasNextPage || isLoading}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Go to last page</span>
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-2" />
        </Button>
      </div>
    </div>
  );
}
