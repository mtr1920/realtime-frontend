/**
 * QuickActions Component
 * Grid of quick action cards for common tasks.
 * Features hover lift, icon glow effect, and staggered reveal animation.
 */

import { Link, type LinkProps } from '@tanstack/react-router';
import { Plus, Video, Users, Settings, FolderKanban, FileText, Lock } from 'lucide-react';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { usePermissions } from '@/features/auth';
import type { Permission } from '@/types';

// =============================================================================
// Types
// =============================================================================

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  permission?: Permission;
}

export interface QuickActionsProps {
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Default Actions
// =============================================================================

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'create-session',
    title: 'Create Session',
    description: 'Start a new session',
    icon: Plus,
    href: '/sessions/create',
    permission: 'canCreateSession',
  },
  {
    id: 'view-sessions',
    title: 'View Sessions',
    description: 'See all your sessions',
    icon: Video,
    href: '/sessions',
  },
  {
    id: 'invite-team',
    title: 'Invite Team Member',
    description: 'Add someone to your workspace',
    icon: Users,
    href: '/users',
    permission: 'canInviteUsers',
  },
  {
    id: 'manage-workspaces',
    title: 'Manage Workspaces',
    description: 'Configure your workspaces',
    icon: FolderKanban,
    href: '/workspaces',
    permission: 'canManageWorkspace',
  },
  {
    id: 'view-outcomes',
    title: 'View Outcomes',
    description: 'Review session outcomes',
    icon: FileText,
    href: '/outcomes',
    permission: 'canViewOutcomes',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure your account',
    icon: Settings,
    href: '/settings',
  },
];

// =============================================================================
// Sub-Components
// =============================================================================

interface QuickActionCardProps {
  action: QuickAction;
  /** Animation delay index for staggered reveal */
  staggerIndex?: number;
}

function QuickActionCard({ action, staggerIndex }: QuickActionCardProps) {
  const Icon = action.icon;

  // Calculate animation delay for staggered reveal
  const animationStyle =
    staggerIndex !== undefined
      ? { animationDelay: `${staggerIndex * 50}ms` }
      : undefined;

  return (
    <Link
      to={action.href as LinkProps['to']}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border border-border bg-card shadow-sm',
        'hover:bg-accent/50 hover:border-primary/30 hover:shadow-md transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        staggerIndex !== undefined && 'animate-slide-up-fade'
      )}
      style={animationStyle}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent transition-colors group-hover:bg-primary/10 flex-shrink-0"
        aria-hidden="true"
      >
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {action.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {action.description}
        </p>
      </div>
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function QuickActions({ className }: QuickActionsProps) {
  const { hasPermission } = usePermissions();

  // Filter actions based on permissions
  const visibleActions = DEFAULT_ACTIONS.filter((action) => {
    if (!action.permission) return true;
    return hasPermission(action.permission);
  });

  if (visibleActions.length === 0) {
    return (
      <EmptyState
        icon={<Lock className="h-6 w-6 text-muted-foreground" />}
        title="No quick actions available"
        description="Contact your administrator to request access to more features."
        className="py-6"
      />
    );
  }

  return (
    <div
      className={cn('grid gap-2 grid-cols-2 h-full', className)}
      role="navigation"
      aria-label="Quick actions"
    >
      {visibleActions.slice(0, 4).map((action, index) => (
        <QuickActionCard key={action.id} action={action} staggerIndex={index} />
      ))}
    </div>
  );
}
