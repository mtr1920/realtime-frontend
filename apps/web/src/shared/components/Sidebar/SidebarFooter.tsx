/**
 * Sidebar Footer
 * User info and settings at bottom of sidebar.
 */

import { LogOut, Settings } from 'lucide-react';
import { Link, type LinkProps } from '@tanstack/react-router';
import { useCurrentUser, useLogout } from '@/shared/hooks';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { SidebarExpandButton } from './SidebarHeader';
import {
  Button,
  UserAvatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Skeleton,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export function SidebarFooter() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const { logout, isLoading: isLogoutLoading } = useLogout();
  const isLoading = isLogoutLoading;

  const handleLogout = () => {
    logout();
  };

  // Show skeleton while user is loading
  if (isUserLoading && !user) {
    if (isCollapsed) {
      return (
        <div className="p-2 border-t border-border/40 flex flex-col items-center gap-2">
          <SidebarExpandButton />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      );
    }

    return (
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="p-2 border-t border-border/40 flex flex-col items-center gap-2">
        <SidebarExpandButton />
        <TooltipProvider delayDuration={0}>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-lg p-0">
                    <UserAvatar
                      src={user?.avatarUrl}
                      alt={user?.displayName}
                      size="md"
                    />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {user?.displayName || 'User menu'}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={'/settings' as LinkProps['to']}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoading ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border/40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 h-auto py-2 px-2',
              'hover:bg-accent'
            )}
          >
            <UserAvatar
              src={user?.avatarUrl}
              alt={user?.displayName}
              size="md"
              className="shrink-0"
            />
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-medium truncate w-full text-left">
                {user?.displayName}
              </span>
              <span className="text-xs text-muted-foreground truncate w-full text-left">
                {user?.email}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={'/settings' as LinkProps['to']}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
