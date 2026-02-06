/**
 * Session Status Badge
 * Visual indicator for session status.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { Circle, CheckCircle, Clock, Pause, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { SessionStatus } from '../../api/sessions.service';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors',
  {
    variants: {
      status: {
        CREATED: 'bg-secondary text-secondary-foreground',
        WAITING: 'bg-warning/15 text-warning dark:bg-warning/20',
        ACTIVE: 'bg-success/15 text-success dark:bg-success/20',
        PAUSED: 'bg-info/15 text-info dark:bg-info/20',
        COMPLETED: 'bg-muted text-muted-foreground',
        EXPIRED: 'bg-warning/15 text-warning dark:bg-warning/20',
        FAILED: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      status: 'CREATED',
      size: 'md',
    },
  }
);

const statusIcons: Record<SessionStatus, React.ComponentType<{ className?: string }>> = {
  CREATED: Circle,
  WAITING: Loader2,
  ACTIVE: CheckCircle,
  PAUSED: Pause,
  COMPLETED: CheckCircle,
  EXPIRED: Clock,
  FAILED: XCircle,
};

const statusLabels: Record<SessionStatus, string> = {
  CREATED: 'Created',
  WAITING: 'Waiting',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
};

interface SessionStatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: SessionStatus;
  showIcon?: boolean;
  className?: string;
}

export function SessionStatusBadge({
  status,
  size,
  showIcon = true,
  className,
}: SessionStatusBadgeProps) {
  const Icon = statusIcons[status] ?? AlertCircle;
  const label = statusLabels[status] ?? status;
  const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <span className={cn(badgeVariants({ status, size }), className)}>
      {showIcon && (
        <Icon
          className={cn(
            iconSize,
            status === 'WAITING' && 'motion-safe:animate-spin',
            status === 'ACTIVE' && 'motion-safe:animate-pulse'
          )}
        />
      )}
      {label}
    </span>
  );
}
