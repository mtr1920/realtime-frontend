/**
 * Header Component
 * Top header bar with page title, search, notifications, and theme toggle.
 */

import { Menu, Bell } from 'lucide-react';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { useUIStore } from '@/shared/stores/ui.store';
import { SearchCommand } from './SearchCommand';
import { ThemeToggle } from './ThemeToggle';
import { Button, Separator } from '@/shared/ui';

export function Header() {
  const toggleMobileOpen = useSidebarStore((state) => state.toggleMobileOpen);
  const pageTitle = useUIStore((state) => state.pageTitle);

  return (
    <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Left side - Mobile menu button & Page title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileOpen}
            className="md:hidden h-9 w-9"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page title */}
          {pageTitle && (
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right side - Search & Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <SearchCommand />

          <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
