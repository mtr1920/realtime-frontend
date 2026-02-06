/**
 * UpcomingSessionsList Component
 * Displays a list of upcoming scheduled sessions.
 */

import { Link, type LinkProps } from '@tanstack/react-router';
import { Clock, Users, Calendar, AlertCircle } from 'lucide-react';
import { Button, Badge, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { UpcomingSession } from '../types/dashboard.types';

// =============================================================================
// Types
// =============================================================================

export interface UpcomingSessionsListProps {
  /** Sessions to display */
  sessions: UpcomingSession[];
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  isError?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Whether user can create sessions */
  canCreateSession?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatScheduledTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sessionDate.getTime() === today.getTime()) {
    return `Today at ${timeStr}`;
  }
  if (sessionDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${timeStr}`;
  }
  return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
}

function getStatusBadge(status: UpcomingSession['status']) {
  switch (status) {
    case 'starting_soon':
      return (
        <Badge variant="default" className="bg-warning text-warning-foreground">
          Starting soon
        </Badge>
      );
    case 'waiting':
      return <Badge variant="secondary">Waiting</Badge>;
    case 'scheduled':
    default:
      return <Badge variant="outline">Scheduled</Badge>;
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

function SessionItemSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-48 mb-2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

function SessionRow({ session }: { session: UpcomingSession }) {
  return (
    <Link
      to={`/sessions/${session.id}/lobby` as LinkProps['to']}
      className="flex items-center justify-between py-3 border-b last:border-b-0 hover:bg-muted/50 -mx-4 px-4 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {formatScheduledTime(session.scheduledAt)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            {session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {getStatusBadge(session.status)}
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function UpcomingSessionsList({
  sessions,
  isLoading,
  isError,
  error,
  onRetry,
  canCreateSession,
  className,
}: UpcomingSessionsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('divide-y', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SessionItemSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('flex flex-col items-center py-8 text-center', className)}>
        <AlertCircle className="w-12 h-12 mb-3 text-destructive opacity-70" />
        <p className="text-sm text-muted-foreground mb-2">
          {error || 'Failed to load upcoming sessions'}
        </p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center py-8 text-center', className)}>
        <Clock className="w-12 h-12 mb-3 opacity-50 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No upcoming sessions</p>
        {canCreateSession && (
          <Button variant="link" size="sm" asChild className="mt-2">
            <Link to={'/sessions/create' as LinkProps['to']}>Schedule one now</Link>
          </Button>
        )}
      </div>
    );
  }

  // Session list
  return (
    <div className={className} role="list" aria-label="Upcoming sessions">
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} />
      ))}
    </div>
  );
}
