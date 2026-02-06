/**
 * Sidebar Header
 * Logo and collapse toggle.
 */

import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/shared/ui';
import { XumaneLogo } from '@/shared/icons';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { cn } from '@/shared/lib/utils';

export function SidebarHeader() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  return (
    <div className="flex items-center justify-between h-16 px-4 border-b border-border/40">
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5', isCollapsed && 'justify-center w-full')}>
        <XumaneLogo size="sm" />
        {!isCollapsed && (
          <span className="text-lg font-semibold text-foreground">
            Xumane Recruit
          </span>
        )}
      </div>

      {/* Collapse Toggle - Hidden when collapsed */}
      {!isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Expand button shown at bottom when sidebar is collapsed.
 */
export function SidebarExpandButton() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  if (!isCollapsed) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className="h-8 w-8"
      aria-label="Expand sidebar"
    >
      <PanelLeft className="w-4 h-4" />
    </Button>
  );
}
