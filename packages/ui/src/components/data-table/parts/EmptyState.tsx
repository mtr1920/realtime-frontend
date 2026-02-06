/**
 * TableEmptyState Component
 *
 * Displays when the table has no data.
 * This is a wrapper around EmptyState that works in a table context.
 */

import type { ReactNode } from 'react';
import { EmptyState } from '../../empty-state';
import { Button } from '../../button';
import type { EmptyAction } from '../types';

export interface TableEmptyStateProps {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Number of columns for proper colspan */
  colSpan: number;
  /** Action element (button, link, etc.) - takes precedence over emptyAction */
  action?: ReactNode;
  /** Simple action config for common use case */
  emptyAction?: EmptyAction;
  /** Additional className */
  className?: string;
}

export function TableEmptyState({
  title = 'No data',
  description = 'No items to display.',
  icon,
  colSpan,
  action,
  emptyAction,
  className,
}: TableEmptyStateProps) {
  // Render action from ReactNode or EmptyAction config
  const renderAction = () => {
    if (action) {
      return action;
    }
    if (emptyAction) {
      return (
        <Button onClick={emptyAction.onClick}>
          {emptyAction.label}
        </Button>
      );
    }
    return undefined;
  };

  return (
    <tr>
      <td colSpan={colSpan} className={className}>
        <EmptyState
          title={title}
          description={description}
          icon={icon}
          action={renderAction()}
          size="md"
        />
      </td>
    </tr>
  );
}
