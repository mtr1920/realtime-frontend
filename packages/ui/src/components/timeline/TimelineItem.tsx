/**
 * TimelineItem Component
 *
 * Individual item in a timeline/activity feed.
 */

import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface TimelineItemProps {
  /** Icon or avatar */
  icon?: ReactNode;
  /** Title/heading */
  title?: ReactNode;
  /** Description text */
  description?: ReactNode;
  /** Timestamp */
  timestamp?: ReactNode;
  /** Additional content */
  children?: ReactNode;
  /** Status variant for styling */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Whether this is the last item */
  isLast?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

const lineVariantStyles = {
  default: 'bg-muted-foreground/20',
  success: 'bg-green-200 dark:bg-green-800',
  warning: 'bg-yellow-200 dark:bg-yellow-800',
  error: 'bg-red-200 dark:bg-red-800',
  info: 'bg-blue-200 dark:bg-blue-800',
};

// ============================================================================
// Component
// ============================================================================

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      icon,
      title,
      description,
      timestamp,
      children,
      variant = 'default',
      isLast = false,
      className,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('relative flex gap-4', className)}>
        {/* Timeline line */}
        <div className="flex flex-col items-center">
          {/* Icon/dot */}
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              variantStyles[variant]
            )}
          >
            {icon ?? (
              <div className="h-2 w-2 rounded-full bg-current" />
            )}
          </div>

          {/* Connecting line */}
          {!isLast && (
            <div
              className={cn(
                'mt-2 w-0.5 flex-1',
                lineVariantStyles[variant]
              )}
            />
          )}
        </div>

        {/* Content */}
        <div className={cn('flex-1 pb-8', isLast && 'pb-0')}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {title && (
                <div className="text-sm font-medium text-foreground">
                  {title}
                </div>
              )}
              {description && (
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>

            {timestamp && (
              <div className="shrink-0 text-xs text-muted-foreground">
                {timestamp}
              </div>
            )}
          </div>

          {/* Additional content */}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    );
  }
);
TimelineItem.displayName = 'TimelineItem';
