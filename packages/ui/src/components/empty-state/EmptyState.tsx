/**
 * EmptyState Component
 *
 * Displays a placeholder when there's no content or data.
 */

import { forwardRef, type ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button or link */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Children content */
  children?: ReactNode;
}

// ============================================================================
// Constants
// ============================================================================

const sizeClasses = {
  sm: {
    container: 'py-8',
    iconWrapper: 'h-10 w-10',
    icon: 'h-5 w-5',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'h-12 w-12',
    icon: 'h-6 w-6',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'h-16 w-16',
    icon: 'h-8 w-8',
    title: 'text-xl',
    description: 'text-base',
  },
};

// ============================================================================
// Component
// ============================================================================

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title = 'No results',
      description,
      action,
      size = 'md',
      className,
      children,
    },
    ref
  ) => {
    const classes = sizeClasses[size];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          classes.container,
          className
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'mb-4 flex items-center justify-center rounded-full bg-muted',
            classes.iconWrapper
          )}
        >
          {icon ?? (
            <InboxIcon
              className={cn('text-muted-foreground', classes.icon)}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Title */}
        <h3 className={cn('font-medium', classes.title)}>{title}</h3>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'mt-1 max-w-sm text-muted-foreground',
              classes.description
            )}
          >
            {description}
          </p>
        )}

        {/* Action */}
        {action && <div className="mt-4">{action}</div>}

        {/* Custom children */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
