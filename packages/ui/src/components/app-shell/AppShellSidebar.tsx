/**
 * AppShellSidebar Component
 *
 * Side navigation panel for the application shell.
 */

import { forwardRef, type ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '../button';
import { cn } from '../../utils';
import { useAppShell } from './AppShellContext';

// ============================================================================
// Types
// ============================================================================

export interface AppShellSidebarProps {
  /** Sidebar content */
  children: ReactNode;
  /** Header content (above navigation) */
  header?: ReactNode;
  /** Footer content (below navigation) */
  footer?: ReactNode;
  /** Width when expanded */
  width?: number;
  /** Width when collapsed */
  collapsedWidth?: number;
  /** Whether sidebar can be collapsed on desktop */
  collapsible?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AppShellSidebar = forwardRef<HTMLElement, AppShellSidebarProps>(
  (
    {
      children,
      header,
      footer,
      width = 256,
      collapsedWidth = 64,
      collapsible = true,
      className,
    },
    ref
  ) => {
    const {
      sidebarOpen,
      setSidebarOpen,
      sidebarCollapsed,
      toggleSidebarCollapsed,
    } = useAppShell();

    const currentWidth = sidebarCollapsed ? collapsedWidth : width;

    return (
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={ref}
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-transform duration-200',
            'md:top-14 md:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
          style={{
            width: `${currentWidth}px`,
          }}
        >
          {/* Mobile close button */}
          <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
            {header ?? <div />}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop header */}
          {header && (
            <div className="hidden border-b p-4 md:block">{header}</div>
          )}

          {/* Navigation content */}
          <nav className="flex-1 overflow-y-auto p-2">{children}</nav>

          {/* Footer */}
          {footer && <div className="border-t p-2">{footer}</div>}

          {/* Collapse toggle (desktop only) */}
          {collapsible && (
            <div className="hidden border-t p-2 md:block">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full',
                  sidebarCollapsed ? 'justify-center p-0' : 'justify-start'
                )}
                onClick={toggleSidebarCollapsed}
                aria-label={
                  sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                <ChevronLeft
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sidebarCollapsed && 'rotate-180'
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="ml-2">Collapse</span>
                )}
              </Button>
            </div>
          )}
        </aside>
      </>
    );
  }
);
AppShellSidebar.displayName = 'AppShellSidebar';
