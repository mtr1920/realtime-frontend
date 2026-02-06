/**
 * AppShellContent Component
 *
 * Main content area for the application shell.
 */

import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useAppShell } from './AppShellContext';

// ============================================================================
// Types
// ============================================================================

export interface AppShellContentProps {
  /** Content */
  children: ReactNode;
  /** Sidebar width (for margin calculation) */
  sidebarWidth?: number;
  /** Collapsed sidebar width */
  collapsedSidebarWidth?: number;
  /** Whether there is a fixed header */
  hasHeader?: boolean;
  /** Header height */
  headerHeight?: number;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AppShellContent = forwardRef<HTMLElement, AppShellContentProps>(
  (
    {
      children,
      sidebarWidth = 256,
      collapsedSidebarWidth = 64,
      hasHeader = true,
      headerHeight = 56,
      className,
    },
    ref
  ) => {
    const { sidebarCollapsed } = useAppShell();

    const marginLeft = sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth;

    return (
      <main
        ref={ref}
        className={cn(
          'min-h-screen transition-[margin] duration-200',
          'md:ml-[var(--sidebar-width)]',
          className
        )}
        style={{
          '--sidebar-width': `${marginLeft}px`,
          paddingTop: hasHeader ? `${headerHeight}px` : undefined,
        } as React.CSSProperties}
      >
        {children}
      </main>
    );
  }
);
AppShellContent.displayName = 'AppShellContent';
