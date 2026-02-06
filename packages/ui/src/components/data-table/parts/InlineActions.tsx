/**
 * InlineActions Component
 *
 * Renders row actions as inline buttons instead of dropdown.
 * Use for tables with 1-3 actions where direct access is preferred.
 */

import { useMemo } from 'react';
import { inlineActionButtonVariants } from '../variants';
import type { RowAction } from '../types';
import { cn } from '../../../utils';

export interface InlineActionsProps<TData> {
  /** The row data */
  row: TData;
  /** Available actions */
  actions: RowAction<TData>[];
}

export function InlineActions<TData>({
  row,
  actions,
}: InlineActionsProps<TData>) {
  // Filter out hidden actions
  const visibleActions = useMemo(() => {
    return actions.filter((action) => {
      if (typeof action.hidden === 'function') {
        return !action.hidden(row);
      }
      return !action.hidden;
    });
  }, [actions, row]);

  // Don't render if no visible actions
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {visibleActions.map((action) => {
        const isDisabled =
          typeof action.disabled === 'function'
            ? action.disabled(row)
            : action.disabled;

        return (
          <button
            key={action.id}
            type="button"
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(row);
            }}
            className={cn(
              inlineActionButtonVariants({ variant: action.variant })
            )}
            aria-label={action.label}
          >
            {action.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4">{action.icon}</span>
            )}
            <span className="sr-only sm:not-sr-only">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
