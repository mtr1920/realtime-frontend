/**
 * Workspace Card
 *
 * Crystalline design aesthetic using Card primitive with variant="crystalline".
 * Features: status stripe, geometric accents, hover reveals, staggered animations.
 */

import { useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import {
  ArrowRight,
  Calendar,
  FolderKanban,
  MoreHorizontal,
  Settings,
  Trash2,
} from 'lucide-react';

import type { Workspace } from '../api/workspaces.service';
import {
  Card,
  CardStripe,
  CardAccent,
  CardCorner,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type StatusGradient,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
  /** Animation stagger index for entrance animation */
  index?: number;
  className?: string;
}

// =============================================================================
// Status Configuration
// =============================================================================

const statusConfig: Record<'active' | 'inactive', StatusGradient> = {
  active: {
    gradient: 'from-emerald-400 to-teal-500',
    glow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-400/30',
  },
  inactive: {
    gradient: 'from-zinc-400 to-zinc-500',
    glow: 'shadow-zinc-500/10',
    ring: 'ring-zinc-400/20',
  },
};

// =============================================================================
// Utilities
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// =============================================================================
// Component
// =============================================================================

export function WorkspaceCard({
  workspace,
  onEdit,
  onDelete,
  index = 0,
  className,
}: WorkspaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const config = workspace.isActive ? statusConfig.active : statusConfig.inactive;

  return (
    <Card
      variant="crystalline"
      tall
      status={config}
      staggerIndex={index}
      isHovered={isHovered}
      showRing={workspace.isActive}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Geometric accent - diagonal stripe */}
      <CardAccent gradient={config.gradient} isHovered={isHovered} />

      {/* Status indicator stripe */}
      <CardStripe gradient={config.gradient} isHovered={isHovered} />

      {/* Content */}
      <div className="relative p-6 pl-7">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Workspace icon */}
            <div
              className={cn(
                'flex items-center justify-center',
                'w-10 h-10 shrink-0 rounded-xl',
                'bg-accent dark:bg-primary/15',
                'transition-colors duration-200',
                'group-hover:bg-accent/80 dark:group-hover:bg-primary/25'
              )}
            >
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Workspace name with link */}
              <Link
                to={`/workspaces/${workspace.id}` as LinkProps['to']}
                className="group/link inline-flex items-center gap-2 transition-colors duration-200"
              >
                <span
                  className={cn(
                    'text-lg font-semibold tracking-tight truncate',
                    'text-foreground',
                    'group-hover/link:text-primary'
                  )}
                >
                  {workspace.name}
                </span>
                <ArrowRight
                  className={cn(
                    'h-4 w-4 text-muted-foreground/50',
                    'transition-all duration-200',
                    'opacity-0 -translate-x-1',
                    'group-hover/link:opacity-100 group-hover/link:translate-x-0',
                    'group-hover/link:text-primary'
                  )}
                  aria-hidden
                />
              </Link>

              {/* Slug identifier */}
              <p className="text-xs text-muted-foreground truncate">
                /{workspace.slug}
              </p>
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-lg shrink-0',
                  'text-muted-foreground hover:text-foreground',
                  'opacity-0 group-hover:opacity-100',
                  'transition-all duration-200',
                  'focus-visible:opacity-100'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Workspace actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/workspaces/${workspace.id}` as LinkProps['to']}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(workspace)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(workspace)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {workspace.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {workspace.description}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge
              variant={workspace.isActive ? 'default' : 'secondary'}
              className="font-medium"
            >
              {workspace.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {workspace.domainType}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="text-xs">{formatDate(workspace.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Subtle corner accent */}
      <CardCorner />
    </Card>
  );
}
