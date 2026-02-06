/**
 * Sessions Shared DataTable
 *
 * Wrapper component using the new DataTable for the sessions list.
 * Features: row status coloring, color-coded actions with grouping, bulk actions.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DataTable, TooltipProvider } from '@/shared/ui';
import type { RowAction, RowStatus } from '@realtime/ui';
import type { Session } from '../../api/sessions.service';
import { createSessionsColumns } from './sessionsColumns';
import { createSessionRowActions, type SessionRowActionHandlers } from './sessionRowActions';

// ============================================================================
// Types
// ============================================================================

export interface SessionsSharedDataTableProps {
  /** Session data to display */
  sessions: Session[];
  /** Loading state */
  isLoading?: boolean;
  /** Called when user starts a session */
  onStart?: (session: Session) => void;
  /** Called when user joins a session */
  onJoin?: (session: Session) => void;
  /** Called when user completes/ends a session */
  onComplete?: (session: Session) => void;
  /** Called when user cancels a session */
  onCancel?: (session: Session) => void;
  /** Called when user deletes a session */
  onDelete?: (session: Session) => void;
  /** Called when user duplicates a session */
  onDuplicate?: (session: Session) => void;
  /** Called when user copies invite link */
  onCopyInviteLink?: (session: Session) => void;
  /** Called when user exports to CSV (toolbar icon) */
  onExportCsv?: (sessions: Session[]) => void;
  /** Called when user exports to Excel (toolbar icon) */
  onExportExcel?: (sessions: Session[]) => void;
}

// ============================================================================
// Row Status Helper
// ============================================================================

/**
 * Maps session status to row visual indicator
 */
function getSessionRowStatus(session: Session): RowStatus {
  switch (session.status) {
    case 'ACTIVE':
    case 'WAITING':
      return 'success'; // Green - in progress
    case 'PAUSED':
      return 'warning'; // Amber - needs attention
    case 'FAILED':
      return 'error'; // Red - problem
    case 'CREATED':
      return 'info'; // Blue - pending start
    case 'COMPLETED':
    case 'EXPIRED':
    default:
      return 'default'; // No special styling
  }
}

// ============================================================================
// Component
// ============================================================================

export function SessionsSharedDataTable({
  sessions,
  isLoading = false,
  onStart,
  onJoin,
  onComplete,
  onCancel,
  onDelete,
  onDuplicate,
  onCopyInviteLink,
  onExportCsv,
  onExportExcel,
}: SessionsSharedDataTableProps) {
  const navigate = useNavigate();

  // Memoize column definitions
  const columns = useMemo(() => createSessionsColumns(), []);

  // Handle row click - navigate to session detail
  const handleRowClick = useCallback(
    (session: Session) => {
      navigate({ to: `/sessions/${session.id}` as '/' });
    },
    [navigate]
  );

  // Handle view details action
  const handleViewDetails = useCallback(
    (session: Session) => {
      navigate({ to: `/sessions/${session.id}` as '/' });
    },
    [navigate]
  );

  // Memoize row actions
  const actionHandlers: SessionRowActionHandlers = useMemo(
    () => ({
      onViewDetails: handleViewDetails,
      onStart,
      onJoin,
      onCopyInviteLink,
      onDuplicate,
      onComplete,
      onCancel,
      onDelete,
    }),
    [handleViewDetails, onStart, onJoin, onCopyInviteLink, onDuplicate, onComplete, onCancel, onDelete]
  );

  const rowActions = useMemo<RowAction<Session>[]>(
    () => createSessionRowActions(actionHandlers),
    [actionHandlers]
  );

  return (
    <TooltipProvider>
      <DataTable
        columns={columns}
        data={sessions}
        getRowId={(row) => row.id}
        // Pagination
        enablePagination
        initialPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        // Features
        enableSorting
        enableGlobalSearch
        // Row actions with color variants and grouping
        rowActions={rowActions}
        onRowClick={handleRowClick}
        // Export buttons in toolbar
        onExportCsv={onExportCsv}
        onExportExcel={onExportExcel}
        // Row status coloring based on session status
        getRowStatus={getSessionRowStatus}
        // States
        isLoading={isLoading}
        emptyTitle="No sessions found"
        emptyDescription="Try adjusting your filters or create a new session."
        showToolbar
        striped
      />
    </TooltipProvider>
  );
}
