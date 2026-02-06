/**
 * Session Card
 *
 * Crystalline data display aesthetic using Card primitive with variant="crystalline".
 * Features: status stripe, geometric accents, hover reveals, staggered animations.
 */

import { useState } from 'react';
import { Link, type LinkProps } from '@tanstack/react-router';
import {
  ArrowRight,
  Calendar,
  Clock,
  MoreHorizontal,
  Play,
  Square,
  Users,
  Zap,
} from 'lucide-react';

import type { Session } from '../../api/sessions.service';
import { SessionStatusBadge } from '../shared/SessionStatusBadge';
import {
  Card,
  CardStripe,
  CardAccent,
  CardCorner,
  Button,
  Avatar,
  AvatarFallback,
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

interface SessionCardProps {
  session: Session;
  onJoin?: (session: Session) => void;
  onComplete?: (session: Session) => void;
  /** Animation delay index for staggered animation */
  index?: number;
  className?: string;
}

// =============================================================================
// Status Configuration
// =============================================================================

type SessionStatus = Session['status'];

const statusConfig: Record<SessionStatus, StatusGradient & { accent: string }> = {
  CREATED: {
    gradient: 'from-slate-400 to-slate-500',
    glow: 'shadow-slate-500/10',
    ring: 'ring-slate-400/20',
    accent: 'bg-slate-500',
  },
  WAITING: {
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-400/30',
    accent: 'bg-amber-500',
  },
  ACTIVE: {
    gradient: 'from-emerald-400 to-teal-500',
    glow: 'shadow-emerald-500/25',
    ring: 'ring-emerald-400/40',
    accent: 'bg-emerald-500',
  },
  PAUSED: {
    gradient: 'from-sky-400 to-blue-500',
    glow: 'shadow-sky-500/20',
    ring: 'ring-sky-400/30',
    accent: 'bg-sky-500',
  },
  COMPLETED: {
    gradient: 'from-zinc-400 to-zinc-500',
    glow: 'shadow-zinc-500/10',
    ring: 'ring-zinc-400/20',
    accent: 'bg-zinc-400',
  },
  EXPIRED: {
    gradient: 'from-orange-400 to-red-500',
    glow: 'shadow-orange-500/15',
    ring: 'ring-orange-400/20',
    accent: 'bg-orange-500',
  },
  FAILED: {
    gradient: 'from-red-400 to-rose-600',
    glow: 'shadow-red-500/20',
    ring: 'ring-red-400/30',
    accent: 'bg-red-500',
  },
};

// =============================================================================
// Utilities
// =============================================================================

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDuration(startedAt: string | null, endedAt: string | null): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

// =============================================================================
// Component
// =============================================================================

export function SessionCard({
  session,
  onJoin,
  onComplete,
  index = 0,
  className,
}: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const canJoin = session.status === 'CREATED' || session.status === 'WAITING' || session.status === 'ACTIVE';
  const canComplete = session.status === 'ACTIVE' || session.status === 'PAUSED';
  const isActive = session.status === 'ACTIVE';
  const isWaiting = session.status === 'WAITING';

  const config = statusConfig[session.status] ?? statusConfig.CREATED;

  const sessionLabel = session.externalId
    ? `#${session.externalId}`
    : `${session.id.slice(0, 8)}`;

  const duration = getDuration(session.startedAt, session.endedAt);

  return (
    <Card
      variant="crystalline"
      status={config}
      staggerIndex={index}
      isHovered={isHovered}
      showRing={isActive || isWaiting}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Geometric accent - diagonal stripe */}
      <CardAccent gradient={config.gradient} isHovered={isHovered} />

      {/* Status indicator stripe */}
      <CardStripe gradient={config.gradient} isHovered={isHovered} />

      {/* Active pulse beacon */}
      {isActive && (
        <div className="absolute top-4 right-4" aria-hidden>
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full',
                'bg-emerald-400 opacity-75',
                'motion-safe:animate-ping'
              )}
            />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative p-5 pl-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {/* Session identifier with editorial typography */}
            <Link
              to={`/sessions/${session.id}` as LinkProps['to']}
              className="group/link inline-flex items-center gap-2 transition-colors duration-200"
            >
              <span className="text-lg font-semibold tracking-tight text-foreground group-hover/link:text-primary">
                Session
              </span>
              <span
                className={cn(
                  'font-mono text-sm font-medium',
                  'text-muted-foreground',
                  'px-1.5 py-0.5 rounded',
                  'bg-muted/50 dark:bg-muted/30',
                  'transition-colors duration-200',
                  'group-hover/link:bg-primary/10 group-hover/link:text-primary'
                )}
              >
                {sessionLabel}
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

            {/* Status badge */}
            <div className="mt-2">
              <SessionStatusBadge status={session.status} size="sm" />
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-lg',
                  'text-muted-foreground hover:text-foreground',
                  'opacity-0 group-hover:opacity-100',
                  'transition-all duration-200',
                  'focus-visible:opacity-100'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Session actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/sessions/${session.id}` as LinkProps['to']}>
                  View details
                </Link>
              </DropdownMenuItem>
              {canJoin && (
                <DropdownMenuItem onClick={() => onJoin?.(session)}>
                  <Play className="mr-2 h-4 w-4" />
                  Join session
                </DropdownMenuItem>
              )}
              {canComplete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onComplete?.(session)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    End session
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm mb-4">
          {session.scheduledAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{formatDate(session.scheduledAt)}</span>
            </div>
          )}
          {session.startedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {formatTime(session.startedAt)}
                {duration && (
                  <span className="text-muted-foreground/60 ml-1">({duration})</span>
                )}
              </span>
            </div>
          )}
          {!session.scheduledAt && !session.startedAt && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>Ready to start</span>
            </div>
          )}
        </div>

        {/* Participants row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden />
            <span>
              {session.participantCount > 0
                ? `${session.participantCount} participant${session.participantCount !== 1 ? 's' : ''}`
                : 'No participants'}
            </span>
          </div>

          {/* Avatar stack */}
          {session.participantCount > 0 && (
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(session.participantCount, 3) }).map(
                (_, i) => (
                  <Avatar
                    key={i}
                    className={cn(
                      'h-6 w-6 ring-2 ring-card',
                      'transition-transform duration-200',
                      isHovered && 'hover:scale-110'
                    )}
                  >
                    <AvatarFallback className="text-[10px] bg-muted font-medium">
                      {String.fromCharCode(65 + i)}
                    </AvatarFallback>
                  </Avatar>
                )
              )}
              {session.participantCount > 3 && (
                <div
                  className={cn(
                    'flex items-center justify-center',
                    'h-6 w-6 rounded-full',
                    'bg-muted text-muted-foreground',
                    'text-[10px] font-medium',
                    'ring-2 ring-card'
                  )}
                >
                  +{session.participantCount - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Join CTA - reveals on hover for joinable sessions */}
        {canJoin && (
          <div
            className={cn(
              'mt-4 pt-4 border-t border-border/50',
              'transition-all duration-300 ease-out',
              // Desktop: hidden until hover
              'max-lg:block',
              isHovered
                ? 'lg:opacity-100 lg:translate-y-0 lg:max-h-20'
                : 'lg:opacity-0 lg:translate-y-2 lg:max-h-0 lg:overflow-hidden lg:mt-0 lg:pt-0 lg:border-t-0'
            )}
          >
            <Button
              size="sm"
              className={cn(
                'w-full font-medium',
                'transition-all duration-200',
                isActive && 'bg-emerald-600 hover:bg-emerald-700',
                isWaiting && 'bg-amber-600 hover:bg-amber-700'
              )}
              onClick={() => onJoin?.(session)}
            >
              <Play className="mr-2 h-4 w-4" />
              {isActive ? 'Join Now' : 'Enter Lobby'}
            </Button>
          </div>
        )}
      </div>

      {/* Subtle corner accent */}
      <CardCorner />
    </Card>
  );
}
