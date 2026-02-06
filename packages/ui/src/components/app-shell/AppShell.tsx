/**
 * AppShell Component
 *
 * Main application layout shell with header, sidebar, and content areas.
 */

import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { AppShellProvider, type AppShellProviderProps } from './AppShellContext';

// ============================================================================
// Types
// ============================================================================

export interface AppShellProps extends Omit<AppShellProviderProps, 'children'> {
  /** Shell content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(
  ({ children, defaultCollapsed, className }, ref) => {
    return (
      <AppShellProvider defaultCollapsed={defaultCollapsed}>
        <div ref={ref} className={cn('min-h-screen bg-background', className)}>
          {children}
        </div>
      </AppShellProvider>
    );
  }
);
AppShell.displayName = 'AppShell';
