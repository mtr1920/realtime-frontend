/**
 * PageHeader Component
 *
 * Page header with title, description, breadcrumbs, and actions.
 */

import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

// ============================================================================
// Types
// ============================================================================

export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Render function for breadcrumb links */
  renderBreadcrumbLink?: (
    item: BreadcrumbItem,
    children: ReactNode
  ) => ReactNode;
  /** Action buttons */
  actions?: ReactNode;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Additional metadata below description */
  meta?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const sizeClasses = {
  sm: {
    container: 'py-4',
    title: 'text-xl',
    description: 'text-sm',
  },
  md: {
    container: 'py-6',
    title: 'text-2xl',
    description: 'text-sm',
  },
  lg: {
    container: 'py-8',
    title: 'text-3xl',
    description: 'text-base',
  },
};

// ============================================================================
// Component
// ============================================================================

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      breadcrumbs,
      renderBreadcrumbLink,
      actions,
      icon,
      meta,
      size = 'md',
      className,
    },
    ref
  ) => {
    const classes = sizeClasses[size];

    return (
      <div ref={ref} className={cn(classes.container, className)}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            items={breadcrumbs}
            renderLink={renderBreadcrumbLink}
            className="mb-4"
          />
        )}

        {/* Header content */}
        <div className="flex items-start justify-between gap-4">
          {/* Title section */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex-shrink-0 text-muted-foreground">
                  {icon}
                </div>
              )}
              <h1
                className={cn(
                  'font-semibold tracking-tight text-foreground',
                  classes.title
                )}
              >
                {title}
              </h1>
            </div>

            {description && (
              <p
                className={cn(
                  'mt-1 text-muted-foreground',
                  classes.description
                )}
              >
                {description}
              </p>
            )}

            {meta && <div className="mt-2">{meta}</div>}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';
