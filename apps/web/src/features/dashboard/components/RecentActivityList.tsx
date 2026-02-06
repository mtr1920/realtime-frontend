/**
 * RecentActivityList Component
 * Displays a list of recent activity items.
 */

import {
  Video,
  FolderKanban,
  Users,
  FileText,
  Link2,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { ActivityItem, ActivityType } from '../types/dashboard.types';

// =============================================================================
// Types
// =============================================================================

export interface RecentActivityListProps {
  /** Activity items to display */
  activities: ActivityItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  isError?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Maximum items to show */
  maxItems?: number;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getActivityIcon(type: ActivityType): React.ElementType {
  switch (type) {
    case 'session':
      return Video;
    case 'workspace':
      return FolderKanban;
    case 'user':
      return Users;
    case 'outcome':
      return FileText;
    case 'integration':
      return Link2;
    default:
      return Activity;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

// =============================================================================
// Sub-Components
// =============================================================================

function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const Icon = getActivityIcon(activity.type);

  return (
    <div className="activity-row" role="listitem">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/70 flex-shrink-0 transition-colors"
        aria-hidden="true"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {activity.description}
        </p>
      </div>
      <time
        className="text-xs text-muted-foreground/80 whitespace-nowrap tabular-nums"
        dateTime={activity.timestamp}
      >
        {formatTimestamp(activity.timestamp)}
      </time>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function RecentActivityList({
  activities,
  isLoading,
  isError,
  error,
  onRetry,
  maxItems = 10,
  className,
}: RecentActivityListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <ActivityItemSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('flex flex-col items-center py-8 text-center', className)}>
        <Activity className="w-12 h-12 mb-3 opacity-50 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {error || 'Failed to load activity'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={cn('flex flex-col items-center py-8 text-center', className)}>
        <Activity className="w-12 h-12 mb-3 opacity-50 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  // Activity list
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={cn('space-y-1', className)} role="list" aria-label="Recent activity">
      {displayedActivities.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
