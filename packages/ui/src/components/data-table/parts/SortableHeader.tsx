/**
 * SortableHeader Component
 *
 * Column header with sort indicator and click-to-sort functionality.
 */

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../../utils';
import type { SortState } from '../types';

export interface SortableHeaderProps {
  /** Column ID */
  columnId: string;
  /** Header content */
  children: React.ReactNode;
  /** Current sort state */
  sortState?: SortState[];
  /** Sort change handler */
  onSort?: (columnId: string) => void;
  /** Additional className */
  className?: string;
}

export function SortableHeader({
  columnId,
  children,
  sortState = [],
  onSort,
  className,
}: SortableHeaderProps) {
  const currentSort = sortState.find((s) => s.columnId === columnId);

  const handleClick = () => {
    onSort?.(columnId);
  };

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-1.5 group',
        className
      )}
      onClick={handleClick}
    >
      <span>{children}</span>
      <span className="text-muted-foreground/60 group-hover:text-foreground transition-colors">
        {!currentSort && (
          <ArrowUpDown className="h-3.5 w-3.5" />
        )}
        {currentSort?.direction === 'asc' && (
          <ArrowUp className="h-3.5 w-3.5 text-foreground" />
        )}
        {currentSort?.direction === 'desc' && (
          <ArrowDown className="h-3.5 w-3.5 text-foreground" />
        )}
      </span>
    </button>
  );
}
