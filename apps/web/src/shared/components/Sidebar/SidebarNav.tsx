/**
 * Sidebar Navigation
 * Navigation items with role-based filtering.
 */

import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Video,
  FolderKanban,
  Users,
  Settings,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { usePermissions } from '@/shared/hooks';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { ScrollArea, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { Permission } from '@/types';

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  permission?: Permission;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Video, label: 'Sessions', href: '/sessions' },
  { icon: FolderKanban, label: 'Workspaces', href: '/workspaces', permission: 'canViewWorkspace' },
  { icon: Users, label: 'Users', href: '/users', permission: 'canViewUsers' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: Shield, label: 'Admin', href: '/admin', permission: 'canAccessAdmin' },
];

export function SidebarNav() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { hasPermission } = usePermissions();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Filter items based on permissions
  const filteredItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <ScrollArea className="flex-1 px-2 py-4">
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
            const Icon = item.icon;

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>
    </ScrollArea>
  );
}
