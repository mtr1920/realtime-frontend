/**
 * Timeline Component
 *
 * Container for timeline/activity feed items.
 */

import { forwardRef, Children, type ReactNode, cloneElement, isValidElement } from 'react';
import { cn } from '../../utils';
import type { TimelineItemProps } from './TimelineItem';

// ============================================================================
// Types
// ============================================================================

export interface TimelineProps {
  /** Timeline items */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className }, ref) => {
    // Add isLast prop to the last child
    const items = Children.toArray(children);
    const enhancedChildren = items.map((child, index) => {
      if (isValidElement<TimelineItemProps>(child)) {
        return cloneElement(child, {
          isLast: index === items.length - 1,
        });
      }
      return child;
    });

    return (
      <div ref={ref} className={cn('relative', className)}>
        {enhancedChildren}
      </div>
    );
  }
);
Timeline.displayName = 'Timeline';
