/**
 * Sessions Stats Header
 * Displays session counts by status with click-to-filter functionality.
 */

import { useMemo, useCallback } from 'react';
import {
  CircleDot,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Session, SessionStatus } from '../../api/sessions.service';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface SessionsStatsHeaderProps {
  sessions: Session[];
  /** Currently selected status filter (null = show all) */
  selectedStatus?: SessionStatus | null;
  /** Callback when a status is clicked for filtering */
  onStatusFilter?: (status: SessionStatus | null) => void;
}

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Text color class using semantic tokens */
  colorClass: string;
  /** Background color class using semantic tokens */
  bgClass: string;
  /** Ring color when selected */
  ringClass: string;
}

/** Only show main statuses - hide WAITING, PAUSED, FAILED */
const STATUS_CONFIG: Partial<Record<SessionStatus, StatusConfig>> = {
  CREATED: {
    label: 'Created',
    icon: CircleDot,
    colorClass: 'text-secondary-foreground',
    bgClass: 'bg-secondary',
    ringClass: 'ring-secondary-foreground/50',
  },
  ACTIVE: {
    label: 'Active',
    icon: Play,
    colorClass: 'text-success',
    bgClass: 'bg-success/15 dark:bg-success/20',
    ringClass: 'ring-success/50',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
    ringClass: 'ring-muted-foreground/50',
  },
  EXPIRED: {
    label: 'Expired',
    icon: AlertCircle,
    colorClass: 'text-warning',
    bgClass: 'bg-warning/15 dark:bg-warning/20',
    ringClass: 'ring-warning/50',
  },
};

/** Visible status filters */
const STATUS_ORDER: SessionStatus[] = [
  'CREATED',
  'ACTIVE',
  'COMPLETED',
  'EXPIRED',
];

export function SessionsStatsHeader({
  sessions,
  selectedStatus,
  onStatusFilter,
}: SessionsStatsHeaderProps) {
  const counts = useMemo(() => {
    const result: Partial<Record<SessionStatus, number>> = {
      CREATED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      EXPIRED: 0,
    };

    for (const session of sessions) {
      if (result[session.status] !== undefined) {
        result[session.status]!++;
      }
    }

    return result;
  }, [sessions]);

  const total = sessions.length;
  const isInteractive = Boolean(onStatusFilter);

  const handleStatusClick = useCallback(
    (status: SessionStatus) => {
      if (!onStatusFilter) return;
      // Toggle filter: if clicking the same status, clear filter
      onStatusFilter(selectedStatus === status ? null : status);
    },
    [onStatusFilter, selectedStatus]
  );

  const handleClearFilter = useCallback(() => {
    onStatusFilter?.(null);
  }, [onStatusFilter]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Total count - clicking clears filter */}
      <button
        type="button"
        onClick={handleClearFilter}
        disabled={!isInteractive}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
          'border border-border bg-muted transition-all',
          isInteractive && 'cursor-pointer hover:bg-muted/80',
          isInteractive && selectedStatus === null && 'ring-2 ring-ring ring-offset-1',
          !isInteractive && 'cursor-default'
        )}
        aria-pressed={selectedStatus === null}
        aria-label="Show all sessions"
      >
        <span>Total</span>
        <Badge variant="secondary" className="ml-1 min-w-[1.5rem] justify-center">
          {total}
        </Badge>
      </button>

      <div className="h-6 w-px bg-border" aria-hidden="true" />

      {/* Status counts - clickable filters */}
      {STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        if (!config) return null;
        const count = counts[status] ?? 0;
        const Icon = config.icon;
        const isSelected = selectedStatus === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusClick(status)}
            disabled={!isInteractive}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium',
              'transition-all',
              config.bgClass,
              isInteractive && 'cursor-pointer hover:opacity-80',
              isInteractive && isSelected && `ring-2 ${config.ringClass} ring-offset-1`,
              !isInteractive && 'cursor-default',
              // Dim non-selected statuses when a filter is active
              isInteractive && selectedStatus !== null && !isSelected && 'opacity-50'
            )}
            aria-pressed={isSelected}
            aria-label={`Filter by ${config.label} (${count} sessions)`}
          >
            <Icon className={cn('h-3.5 w-3.5', config.colorClass)} aria-hidden="true" />
            <span className={config.colorClass}>{config.label}</span>
            <span
              className={cn(
                'ml-0.5 min-w-[1.25rem] text-center text-xs font-semibold',
                config.colorClass
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
