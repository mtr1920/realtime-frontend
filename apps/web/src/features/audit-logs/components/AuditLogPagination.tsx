/**
 * AuditLogPagination Component
 * Pagination controls for audit logs.
 */

import { Button } from '@/shared/ui';

interface AuditLogPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function AuditLogPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: AuditLogPaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
        Showing {total} log{total !== 1 ? 's' : ''}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} logs
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="px-3 text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          Last
        </Button>
      </div>
    </div>
  );
}
