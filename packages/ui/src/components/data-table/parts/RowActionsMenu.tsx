/**
 * RowActionsMenu Component
 *
 * Dropdown menu for row actions using shadcn/ui DropdownMenu.
 * Supports color variants and action grouping with visual separators.
 */

import { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../primitives/dropdown-menu';
import { actionMenuItemVariants } from '../variants';
import type { RowAction, ActionGroup } from '../types';
import { cn } from '../../../utils';

export interface RowActionsMenuProps<TData> {
  /** The row data */
  row: TData;
  /** Available actions */
  actions: RowAction<TData>[];
}

/** Group order for sorting actions */
const GROUP_ORDER: Record<ActionGroup, number> = {
  primary: 0,
  secondary: 1,
  danger: 2,
};

export function RowActionsMenu<TData>({
  row,
  actions,
}: RowActionsMenuProps<TData>) {
  // Filter out hidden actions and group them
  const groupedActions = useMemo(() => {
    const visible = actions.filter((action) => {
      if (typeof action.hidden === 'function') {
        return !action.hidden(row);
      }
      return !action.hidden;
    });

    // Check if any action has a group defined
    const hasGroups = visible.some((a) => a.group);

    if (!hasGroups) {
      // No grouping - return single group
      return [{ group: null as ActionGroup | null, actions: visible }];
    }

    // Group actions by their group property
    const groups = new Map<ActionGroup | null, RowAction<TData>[]>();

    visible.forEach((action) => {
      const group = action.group ?? 'primary';
      const existing = groups.get(group) ?? [];
      groups.set(group, [...existing, action]);
    });

    // Sort groups by order and return
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const orderA = a ? GROUP_ORDER[a] : 0;
        const orderB = b ? GROUP_ORDER[b] : 0;
        return orderA - orderB;
      })
      .map(([group, groupActions]) => ({ group, actions: groupActions }));
  }, [actions, row]);

  // Don't render if no visible actions
  const totalActions = groupedActions.reduce((sum, g) => sum + g.actions.length, 0);
  if (totalActions === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {groupedActions.map((groupData, groupIndex) => (
          <div key={groupData.group ?? 'default'}>
            {/* Add separator between groups (not before first) */}
            {groupIndex > 0 && <DropdownMenuSeparator />}

            {groupData.actions.map((action) => {
              const isDisabled =
                typeof action.disabled === 'function'
                  ? action.disabled(row)
                  : action.disabled;

              return (
                <DropdownMenuItem
                  key={action.id}
                  disabled={isDisabled}
                  onClick={() => action.onClick(row)}
                  className={cn(
                    actionMenuItemVariants({ variant: action.variant })
                  )}
                >
                  {action.icon && (
                    <span className="mr-2 [&>svg]:h-4 [&>svg]:w-4">{action.icon}</span>
                  )}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
