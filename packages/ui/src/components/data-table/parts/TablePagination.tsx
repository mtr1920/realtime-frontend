/**
 * TablePagination Component
 *
 * Pagination controls for the DataTable.
 */

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '../../button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select';
import {
  paginationVariants,
  paginationInfoVariants,
  paginationControlsVariants,
} from '../variants';
import { cn } from '../../../utils';
import type { PaginationState } from '../types';

export interface TablePaginationProps {
  /** Pagination state */
  pagination: PaginationState;
  /** Pagination state change handler */
  onPaginationChange: (pagination: PaginationState) => void;
  /** Total number of items */
  totalItems: number;
  /** Page size options */
  pageSizeOptions?: number[];
  /** Additional className */
  className?: string;
}

export function TablePagination({
  pagination,
  onPaginationChange,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: TablePaginationProps) {
  const { pageIndex, pageSize } = pagination;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  const canGoPrevious = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

  const goToPage = (page: number) => {
    onPaginationChange({ ...pagination, pageIndex: page });
  };

  const goToFirstPage = () => goToPage(0);
  const goToPreviousPage = () => goToPage(pageIndex - 1);
  const goToNextPage = () => goToPage(pageIndex + 1);
  const goToLastPage = () => goToPage(totalPages - 1);

  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value, 10);
    // Adjust page index to keep the same start item visible
    const newPageIndex = Math.floor((pageIndex * pageSize) / newPageSize);
    onPaginationChange({
      pageIndex: newPageIndex,
      pageSize: newPageSize,
    });
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={cn(paginationVariants(), className)}>
      <div className={paginationInfoVariants()}>
        Showing {startItem} to {endItem} of {totalItems} items
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page info */}
        <span className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages}
        </span>

        {/* Navigation buttons */}
        <div className={paginationControlsVariants()}>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToFirstPage}
            disabled={!canGoPrevious}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPreviousPage}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextPage}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToLastPage}
            disabled={!canGoNext}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
