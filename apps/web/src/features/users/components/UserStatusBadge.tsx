/**
 * User Status Badge
 * Visual indicator for user account status.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, Clock, Ban } from 'lucide-react';
import type { UserStatus } from '../types/users.types';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full transition-colors',
  {
    variants: {
      status: {
        ACTIVE: 'bg-success/15 text-success dark:bg-success/20',
        PENDING: 'bg-warning/15 text-warning dark:bg-warning/20',
        SUSPENDED: 'bg-destructive/15 text-destructive dark:bg-destructive/20',
      },
    },
    defaultVariants: {
      status: 'PENDING',
    },
  }
);

const statusIcons: Record<UserStatus, React.ComponentType<{ className?: string }>> = {
  ACTIVE: CheckCircle,
  PENDING: Clock,
  SUSPENDED: Ban,
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
};

interface UserStatusBadgeProps extends VariantProps<typeof badgeVariants> {
  status: UserStatus;
  showIcon?: boolean;
  className?: string;
}

export function UserStatusBadge({
  status,
  showIcon = true,
  className,
}: UserStatusBadgeProps) {
  const Icon = statusIcons[status] ?? Clock;
  const label = statusLabels[status] ?? status;

  return (
    <span
      className={cn(badgeVariants({ status }), className)}
      role="status"
      aria-label={`User status: ${label}`}
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {label}
    </span>
  );
}
