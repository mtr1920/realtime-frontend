/**
 * StatusBadge Component
 *
 * A configurable badge component for displaying status values.
 * Maps status strings to badge variants and labels using a provided config.
 */

import type { HTMLAttributes } from 'react';
import { Badge } from '@/shared/ui';

/** Badge variant type matching the Badge component */
export type StatusBadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

/** Configuration for a single status */
export interface StatusConfig {
  /** Display label for the status */
  label: string;
  /** Badge variant to use */
  variant: StatusBadgeVariant;
  /** Optional icon to show before label */
  icon?: React.ReactNode;
}

/** Map of status values to their configurations */
export type StatusMap<T extends string = string> = Record<T, StatusConfig>;

export interface StatusBadgeProps<T extends string = string>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The current status value */
  status: T;
  /** Map of status values to their display configurations */
  statusMap: StatusMap<T>;
  /** Fallback config for unknown statuses */
  fallback?: StatusConfig;
}

/**
 * StatusBadge renders a Badge with variant and label based on status.
 *
 * @example
 * const sessionStatusMap: StatusMap<SessionStatus> = {
 *   scheduled: { label: 'Scheduled', variant: 'secondary' },
 *   in_progress: { label: 'In Progress', variant: 'default' },
 *   completed: { label: 'Completed', variant: 'success' },
 *   cancelled: { label: 'Cancelled', variant: 'destructive' },
 * };
 *
 * <StatusBadge status={session.status} statusMap={sessionStatusMap} />
 */
export function StatusBadge<T extends string = string>({
  status,
  statusMap,
  fallback = { label: status, variant: 'outline' },
  className,
  ...props
}: StatusBadgeProps<T>) {
  const config = statusMap[status] ?? fallback;

  return (
    <Badge variant={config.variant} className={className} {...props}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
