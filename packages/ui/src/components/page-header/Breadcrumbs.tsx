/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumb trail.
 */

import { forwardRef, type ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Optional icon */
  icon?: ReactNode;
}

export interface BreadcrumbsProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Render function for links */
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Separator icon */
  separator?: ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    {
      items,
      renderLink,
      showHomeIcon = true,
      separator,
      className,
    },
    ref
  ) => {
    const defaultSeparator = <ChevronRight className="h-4 w-4" />;

    const renderItem = (item: BreadcrumbItem, isLast: boolean, index: number) => {
      const content = (
        <span className="flex items-center gap-1.5">
          {item.icon}
          {showHomeIcon && index === 0 && !item.icon && (
            <Home className="h-4 w-4" />
          )}
          <span>{item.label}</span>
        </span>
      );

      if (isLast || !item.href) {
        return (
          <span
            className={cn(
              'text-sm',
              isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}
            aria-current={isLast ? 'page' : undefined}
          >
            {content}
          </span>
        );
      }

      if (renderLink) {
        return renderLink(item, content);
      }

      return (
        <a
          href={item.href}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {content}
        </a>
      );
    };

    if (items.length === 0) {
      return null;
    }

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={className}>
        <ol className="flex items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center gap-2">
                {renderItem(item, isLast, index)}
                {!isLast && (
                  <span
                    className="text-muted-foreground"
                    aria-hidden="true"
                  >
                    {separator ?? defaultSeparator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';
