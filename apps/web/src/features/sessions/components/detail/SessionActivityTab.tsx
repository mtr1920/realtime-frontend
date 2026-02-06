/**
 * Session Activity Tab
 * Chronological event timeline with infinite scroll.
 * Fetches its own data via TanStack Query.
 */

import { useMemo, useState } from 'react';
import {
  Activity,
  UserPlus,
  UserMinus,
  Play,
  Square,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageSquare,
  AlertTriangle,
  Settings,
  RefreshCw,
} from 'lucide-react';
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionEvents } from '../../hooks/useSessionEvents';
import { useSessionParticipants } from '../../hooks/useSessionParticipants';

export type EventType =
  | 'session.started'
  | 'session.ended'
  | 'session.paused'
  | 'session.resumed'
  | 'participant.joined'
  | 'participant.left'
  | 'participant.removed'
  | 'recording.started'
  | 'recording.stopped'
  | 'media.video.enabled'
  | 'media.video.disabled'
  | 'media.audio.enabled'
  | 'media.audio.disabled'
  | 'screen.share.started'
  | 'screen.share.stopped'
  | 'ai.message'
  | 'compliance.violation'
  | 'config.updated'
  | 'connection.reconnected';

export interface SessionEvent {
  id: string;
  type: EventType;
  actorId?: string;
  actorName?: string;
  targetId?: string;
  targetName?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
}

interface SessionActivityTabProps {
  /** Session ID to fetch events for */
  sessionId: string;
}

const EVENT_CONFIG: Record<
  EventType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    category: 'session' | 'participant' | 'media' | 'ai' | 'compliance' | 'system';
  }
> = {
  'session.started': {
    icon: Play,
    label: 'Session started',
    color: 'text-green-500',
    category: 'session',
  },
  'session.ended': {
    icon: Square,
    label: 'Session ended',
    color: 'text-gray-500',
    category: 'session',
  },
  'session.paused': {
    icon: Square,
    label: 'Session paused',
    color: 'text-amber-500',
    category: 'session',
  },
  'session.resumed': {
    icon: Play,
    label: 'Session resumed',
    color: 'text-green-500',
    category: 'session',
  },
  'participant.joined': {
    icon: UserPlus,
    label: 'Participant joined',
    color: 'text-blue-500',
    category: 'participant',
  },
  'participant.left': {
    icon: UserMinus,
    label: 'Participant left',
    color: 'text-gray-500',
    category: 'participant',
  },
  'participant.removed': {
    icon: UserMinus,
    label: 'Participant removed',
    color: 'text-red-500',
    category: 'participant',
  },
  'recording.started': {
    icon: Video,
    label: 'Recording started',
    color: 'text-red-500',
    category: 'media',
  },
  'recording.stopped': {
    icon: VideoOff,
    label: 'Recording stopped',
    color: 'text-gray-500',
    category: 'media',
  },
  'media.video.enabled': {
    icon: Video,
    label: 'Video enabled',
    color: 'text-blue-500',
    category: 'media',
  },
  'media.video.disabled': {
    icon: VideoOff,
    label: 'Video disabled',
    color: 'text-gray-500',
    category: 'media',
  },
  'media.audio.enabled': {
    icon: Mic,
    label: 'Audio enabled',
    color: 'text-blue-500',
    category: 'media',
  },
  'media.audio.disabled': {
    icon: MicOff,
    label: 'Audio disabled',
    color: 'text-gray-500',
    category: 'media',
  },
  'screen.share.started': {
    icon: Monitor,
    label: 'Screen share started',
    color: 'text-purple-500',
    category: 'media',
  },
  'screen.share.stopped': {
    icon: Monitor,
    label: 'Screen share stopped',
    color: 'text-gray-500',
    category: 'media',
  },
  'ai.message': {
    icon: MessageSquare,
    label: 'AI message',
    color: 'text-indigo-500',
    category: 'ai',
  },
  'compliance.violation': {
    icon: AlertTriangle,
    label: 'Compliance violation',
    color: 'text-red-500',
    category: 'compliance',
  },
  'config.updated': {
    icon: Settings,
    label: 'Config updated',
    color: 'text-gray-500',
    category: 'system',
  },
  'connection.reconnected': {
    icon: RefreshCw,
    label: 'Connection restored',
    color: 'text-green-500',
    category: 'system',
  },
};

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All events' },
  { value: 'session', label: 'Session' },
  { value: 'participant', label: 'Participants' },
  { value: 'media', label: 'Media' },
  { value: 'ai', label: 'AI' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'system', label: 'System' },
];

// =============================================================================
// Utility Functions
// =============================================================================

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getEventDescription(event: SessionEvent): string {
  const config = EVENT_CONFIG[event.type];
  if (!config) return event.type;

  let description = config.label;

  if (event.actorName) {
    description = `${event.actorName} - ${description}`;
  }
  if (event.targetName) {
    description += ` (${event.targetName})`;
  }

  return description;
}

// =============================================================================
// Component
// =============================================================================

export function SessionActivityTab({ sessionId }: SessionActivityTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fetch events and participants for this session
  const {
    events: rawEvents,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading: isLoadingEvents,
  } = useSessionEvents(sessionId);

  const { participants: rawParticipants, isLoading: isLoadingParticipants } =
    useSessionParticipants(sessionId);

  const isLoading = isLoadingEvents || isLoadingParticipants;

  // Build participant lookup map for resolving actor/target names
  const participantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    rawParticipants.forEach((p) => {
      map.set(p.id, p.displayName);
      if (p.userId) {
        map.set(p.userId, p.displayName);
      }
    });
    return map;
  }, [rawParticipants]);

  // Map API events to view model with resolved actor/target names
  const events: SessionEvent[] = useMemo(() => {
    return rawEvents.map((e) => ({
      id: e.id,
      type: e.type as SessionEvent['type'],
      actorId: e.actorId ?? undefined,
      actorName: e.actorId ? participantNameMap.get(e.actorId) : undefined,
      targetId: e.targetId ?? undefined,
      targetName: e.targetId ? participantNameMap.get(e.targetId) : undefined,
      payload: e.payload,
      occurredAt: e.occurredAt,
    }));
  }, [rawEvents, participantNameMap]);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'all') return events;
    return events.filter((event) => {
      const config = EVENT_CONFIG[event.type];
      return config?.category === categoryFilter;
    });
  }, [events, categoryFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading activity...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-6 w-6 text-muted-foreground" />}
        title="No activity yet"
        description="Events will appear here as they occur during the session."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredEvents.length} events
        </span>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter events" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const config = EVENT_CONFIG[event.type] || {
              icon: Activity,
              label: event.type,
              color: 'text-gray-500',
              category: 'system',
            };
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative flex items-start gap-4 pl-10">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted',
                    config.color
                  )}
                >
                  <Icon className="h-3 w-3" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {getEventDescription(event)}
                      </p>
                      {event.payload && Object.keys(event.payload).length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {JSON.stringify(event.payload).slice(0, 100)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(event.occurredAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatTime(event.occurredAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
