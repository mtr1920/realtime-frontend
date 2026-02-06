/**
 * AppShellHeader Component
 *
 * Top header bar for the application shell.
 */

import { forwardRef, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../button';
import { cn } from '../../utils';
import { useAppShell } from './AppShellContext';

// ============================================================================
// Types
// ============================================================================

export interface AppShellHeaderProps {
  /** Logo or brand element */
  logo?: ReactNode;
  /** Left side content (after logo) */
  left?: ReactNode;
  /** Center content */
  center?: ReactNode;
  /** Right side content */
  right?: ReactNode;
  /** Whether to show mobile menu toggle */
  showMobileToggle?: boolean;
  /** Fixed position */
  fixed?: boolean;
  /** Additional class name */
  className?: string;
  /** Children content */
  children?: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(
  (
    {
      logo,
      left,
      center,
      right,
      showMobileToggle = true,
      fixed = true,
      className,
      children,
    },
    ref
  ) => {
    const { toggleSidebar } = useAppShell();

    return (
      <header
        ref={ref}
        className={cn(
          'z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          fixed && 'fixed inset-x-0 top-0',
          className
        )}
      >
        <div className="flex h-14 items-center gap-4 px-4">
          {/* Mobile menu toggle */}
          {showMobileToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Logo */}
          {logo && <div className="flex shrink-0 items-center">{logo}</div>}

          {/* Left content */}
          {left && <div className="flex items-center gap-2">{left}</div>}

          {/* Center content */}
          {center && (
            <div className="flex flex-1 items-center justify-center">
              {center}
            </div>
          )}

          {/* Spacer if no center */}
          {!center && <div className="flex-1" />}

          {/* Right content */}
          {right && <div className="flex items-center gap-2">{right}</div>}

          {/* Custom children */}
          {children}
        </div>
      </header>
    );
  }
);
AppShellHeader.displayName = 'AppShellHeader';
