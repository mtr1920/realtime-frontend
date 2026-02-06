/**
 * BulkActionsBar Component
 *
 * Displays selected row count and bulk action buttons.
 * Shown when rows are selected in DataTable.
 */

import { X } from 'lucide-react';
import { Button } from '../../button';
import {
  bulkActionsBarVariants,
  bulkActionsInfoVariants,
  bulkActionsControlsVariants,
  inlineActionButtonVariants,
} from '../variants';
import type { BulkAction } from '../types';
import { cn } from '../../../utils';

export interface BulkActionsBarProps<TData> {
  /** Number of selected rows */
  selectedCount: number;
  /** Selected row data */
  selectedRows: TData[];
  /** Bulk actions */
  actions: BulkAction<TData>[];
  /** Clear selection handler */
  onClearSelection?: () => void;
}

export function BulkActionsBar<TData>({
  selectedCount,
  selectedRows,
  actions,
  onClearSelection,
}: BulkActionsBarProps<TData>) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={bulkActionsBarVariants()}>
      <div className="flex items-center gap-3">
        {/* Clear selection button */}
        {onClearSelection && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Selection count */}
        <span className={bulkActionsInfoVariants()}>
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      {/* Bulk action buttons */}
      <div className={bulkActionsControlsVariants()}>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => action.onClick(selectedRows)}
            className={cn(
              inlineActionButtonVariants({
                variant: action.variant,
                size: 'md',
              })
            )}
          >
            {action.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4">{action.icon}</span>
            )}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
