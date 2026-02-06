/**
 * Sessions Column Definitions
 *
 * Column definitions for the sessions data table.
 */

/* eslint-disable react-refresh/only-export-components */

import { Link, type LinkProps } from '@tanstack/react-router';
import { Copy, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { TableColumn } from '@realtime/ui';
import {
  Button,
  Badge,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';
import type { Session, SessionStatus } from '../../api/sessions.service';
import { SessionStatusBadge } from '../shared/SessionStatusBadge';

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getDuration = (session: Session): string => {
  if (!session.startedAt) return '-';
  const start = new Date(session.startedAt);
  const end = session.endedAt ? new Date(session.endedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

const getExpiryDisplay = (session: Session): string => {
  if (!session.expiresAt) return '-';
  const now = new Date();
  const expires = new Date(session.expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs < 0) {
    return 'Expired';
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  }
  return `${diffMinutes}m`;
};

// ============================================================================
// Status Filter Options
// ============================================================================

export const sessionStatusOptions: Array<{ label: string; value: SessionStatus }> = [
  { label: 'Created', value: 'CREATED' },
  { label: 'Waiting', value: 'WAITING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Failed', value: 'FAILED' },
];

// ============================================================================
// Copy ID Cell Component
// ============================================================================

interface CopyIdCellProps {
  session: Session;
}

function CopyIdCell({ session }: CopyIdCellProps) {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(session.id);
    toast.success('Session ID copied');
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        to={`/sessions/${session.id}` as LinkProps['to']}
        className="hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        {session.externalId || session.id.slice(0, 8)}
      </Link>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy ID</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ============================================================================
// Selection Header Component
// ============================================================================

interface SelectionHeaderProps {
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

export function SelectionHeader({
  allSelected,
  someSelected,
  onSelectAll,
}: SelectionHeaderProps) {
  return (
    <Checkbox
      checked={allSelected || (someSelected && 'indeterminate')}
      onCheckedChange={(value) => onSelectAll(!!value)}
      aria-label="Select all"
    />
  );
}

// ============================================================================
// Selection Cell Component
// ============================================================================

interface SelectionCellProps {
  session: Session;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function SelectionCell({ session, isSelected, onSelect }: SelectionCellProps) {
  return (
    <Checkbox
      checked={isSelected}
      onCheckedChange={(value) => onSelect(!!value)}
      aria-label={`Select session ${session.externalId || session.id.slice(0, 8)}`}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ============================================================================
// Column Definitions
// ============================================================================

export function createSessionsColumns(): TableColumn<Session>[] {
  return [
    // Session ID column
    {
      id: 'session',
      header: 'Session',
      accessor: (row) => row.externalId || row.id,
      cell: (row) => <CopyIdCell session={row} />,
      sortable: true,
    },

    // Workspace column
    {
      id: 'workspaceId',
      header: 'Workspace',
      accessor: 'workspaceId',
      cell: (row) => (
        <Badge variant="outline" className="font-normal">
          {row.workspaceId.slice(0, 8)}
        </Badge>
      ),
      sortable: true,
    },

    // Status column
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (row) => <SessionStatusBadge status={row.status} />,
      sortable: true,
    },

    // Scheduled At column
    {
      id: 'scheduledAt',
      header: 'Scheduled',
      accessor: 'scheduledAt',
      cell: (row) => (
        <span className="text-muted-foreground">{formatDate(row.scheduledAt)}</span>
      ),
      sortable: true,
    },

    // Started At column
    {
      id: 'startedAt',
      header: 'Started',
      accessor: 'startedAt',
      cell: (row) => (
        <span className="text-muted-foreground">{formatDate(row.startedAt)}</span>
      ),
      sortable: true,
    },

    // Duration column (computed)
    {
      id: 'duration',
      header: 'Duration',
      accessor: (row) => row.startedAt ? new Date().getTime() - new Date(row.startedAt).getTime() : 0,
      cell: (row) => (
        <span className="text-muted-foreground">{getDuration(row)}</span>
      ),
      sortable: true,
    },

    // Participants column
    {
      id: 'participantCount',
      header: 'Participants',
      accessor: 'participantCount',
      cell: (row) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{row.participantCount}</span>
        </div>
      ),
      sortable: true,
    },

    // Expires At column
    {
      id: 'expiresAt',
      header: 'Expires',
      accessor: 'expiresAt',
      cell: (row) => (
        <span className="text-muted-foreground">
          {getExpiryDisplay(row)}
        </span>
      ),
      sortable: true,
    },
  ];
}
