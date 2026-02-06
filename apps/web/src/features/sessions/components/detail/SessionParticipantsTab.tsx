/**
 * Session Participants Tab
 * Displays list of participants with status and actions.
 * Fetches its own data via TanStack Query.
 */

import { useMemo } from 'react';
import { Users, UserMinus, MoreHorizontal, Circle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { ParticipantStatus } from '@/types';
import { useSessionParticipants } from '../../hooks/useSessionParticipants';

// Re-export for backwards compatibility
export type { ParticipantStatus };

export interface Participant {
  id: string;
  displayName: string;
  roleId: string;
  roleName: string;
  status: ParticipantStatus;
  joinedAt: string | null;
  leftAt: string | null;
  lastSeenAt: string | null;
}

interface SessionParticipantsTabProps {
  /** Session ID to fetch participants for */
  sessionId: string;
  /** Whether the user can remove participants */
  canRemove?: boolean;
  /** Callback when a participant is removed */
  onRemove?: (participant: Participant) => void;
}

const STATUS_CONFIG: Record<
  ParticipantStatus,
  { label: string; color: string; dotColor: string }
> = {
  INVITED: {
    label: 'Invited',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dotColor: 'bg-slate-400',
  },
  JOINING: {
    label: 'Joining',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dotColor: 'bg-amber-400',
  },
  ACTIVE: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dotColor: 'bg-emerald-400',
  },
  RECONNECTING: {
    label: 'Reconnecting',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    dotColor: 'bg-orange-400 animate-pulse',
  },
  LEFT: {
    label: 'Left',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    dotColor: 'bg-gray-400',
  },
  REMOVED: {
    label: 'Removed',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dotColor: 'bg-red-400',
  },
};

function ParticipantStatusBadge({ status }: { status: ParticipantStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('gap-1.5', config.color)}>
      <Circle className={cn('h-2 w-2 fill-current', config.dotColor)} />
      {config.label}
    </Badge>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatTime(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDuration(joinedAt: string | null, leftAt: string | null): string {
  if (!joinedAt) return '-';
  const start = new Date(joinedAt);
  const end = leftAt ? new Date(leftAt) : new Date();
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

export function SessionParticipantsTab({
  sessionId,
  canRemove,
  onRemove,
}: SessionParticipantsTabProps) {
  // Fetch participants for this session
  const { participants: rawParticipants, isLoading } = useSessionParticipants(sessionId);

  // Map API participants to view model (adding roleName from roleId)
  const participants: Participant[] = useMemo(() => {
    return rawParticipants.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      roleId: p.roleId,
      // Convert roleId to display name (capitalize and replace underscores)
      roleName: p.roleId
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '),
      status: p.status,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
      lastSeenAt: p.lastSeenAt,
    }));
  }, [rawParticipants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading participants...</div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6 text-muted-foreground" />}
        title="No participants yet"
        description="Participants will appear here when they join the session."
      />
    );
  }

  const activeCount = participants.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{participants.length}</span> total
        </span>
        <span>
          <span className="font-medium text-emerald-600">{activeCount}</span> active
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Duration</TableHead>
              {canRemove && <TableHead className="w-[50px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell className="font-medium">
                  {participant.displayName}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{participant.roleName}</Badge>
                </TableCell>
                <TableCell>
                  <ParticipantStatusBadge status={participant.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(participant.joinedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getDuration(participant.joinedAt, participant.leftAt)}
                </TableCell>
                {canRemove && (
                  <TableCell>
                    {(participant.status === 'ACTIVE' ||
                      participant.status === 'RECONNECTING') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onRemove?.(participant)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove participant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
