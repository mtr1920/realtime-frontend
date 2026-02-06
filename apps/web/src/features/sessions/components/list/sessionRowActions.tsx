/**
 * Session Row Actions
 *
 * Row action configurations for the sessions data table.
 * Uses color variants and grouping for better UX.
 */

import {
  Play,
  Square,
  ExternalLink,
  Link2,
  CopyPlus,
  XCircle,
  Trash2,
} from 'lucide-react';
import type { RowAction } from '@realtime/ui';
import type { Session, SessionStatus } from '../../api/sessions.service';

// ============================================================================
// Action Visibility Helpers
// ============================================================================

const canStart = (status: SessionStatus): boolean => status === 'CREATED';
const canInvite = (status: SessionStatus): boolean =>
  status === 'CREATED' || status === 'WAITING';
const canJoin = (status: SessionStatus): boolean =>
  status === 'CREATED' || status === 'WAITING' || status === 'ACTIVE';
const canComplete = (status: SessionStatus): boolean =>
  status === 'ACTIVE' || status === 'PAUSED';
const canCancel = (status: SessionStatus): boolean =>
  status === 'CREATED' || status === 'WAITING';
const canDelete = (status: SessionStatus): boolean =>
  status === 'COMPLETED' || status === 'EXPIRED' || status === 'FAILED';

// ============================================================================
// Row Actions Factory
// ============================================================================

export interface SessionRowActionHandlers {
  onViewDetails?: (session: Session) => void;
  onStart?: (session: Session) => void;
  onJoin?: (session: Session) => void;
  onCopyInviteLink?: (session: Session) => void;
  onDuplicate?: (session: Session) => void;
  onComplete?: (session: Session) => void;
  onCancel?: (session: Session) => void;
  onDelete?: (session: Session) => void;
}

export function createSessionRowActions(
  handlers: SessionRowActionHandlers
): RowAction<Session>[] {
  const actions: RowAction<Session>[] = [];

  // === Primary Group: Main actions ===

  // View details - always shown
  if (handlers.onViewDetails) {
    actions.push({
      id: 'view-details',
      label: 'View details',
      icon: <ExternalLink className="h-4 w-4" />,
      variant: 'info',
      group: 'primary',
      onClick: handlers.onViewDetails,
    });
  }

  // Start session - only when CREATED
  if (handlers.onStart) {
    actions.push({
      id: 'start',
      label: 'Start session',
      icon: <Play className="h-4 w-4" />,
      variant: 'success',
      group: 'primary',
      onClick: handlers.onStart,
      hidden: (session) => !canStart(session.status),
    });
  }

  // Join session - only when WAITING or ACTIVE
  if (handlers.onJoin) {
    actions.push({
      id: 'join',
      label: 'Join session',
      icon: <Play className="h-4 w-4" />,
      variant: 'success',
      group: 'primary',
      onClick: handlers.onJoin,
      hidden: (session) => !canJoin(session.status),
    });
  }

  // === Secondary Group: Utility actions ===

  // Copy invite link - only when CREATED or WAITING
  if (handlers.onCopyInviteLink) {
    actions.push({
      id: 'copy-invite-link',
      label: 'Copy invite link',
      icon: <Link2 className="h-4 w-4" />,
      group: 'secondary',
      onClick: handlers.onCopyInviteLink,
      hidden: (session) => !canInvite(session.status),
    });
  }

  // Duplicate session - always available
  if (handlers.onDuplicate) {
    actions.push({
      id: 'duplicate',
      label: 'Duplicate session',
      icon: <CopyPlus className="h-4 w-4" />,
      variant: 'secondary',
      group: 'secondary',
      onClick: handlers.onDuplicate,
    });
  }

  // === Danger Group: Destructive actions ===

  // End session - only when ACTIVE or PAUSED
  if (handlers.onComplete) {
    actions.push({
      id: 'end',
      label: 'End session',
      icon: <Square className="h-4 w-4" />,
      variant: 'warning',
      group: 'danger',
      onClick: handlers.onComplete,
      hidden: (session) => !canComplete(session.status),
    });
  }

  // Cancel session - only when CREATED or WAITING
  if (handlers.onCancel) {
    actions.push({
      id: 'cancel',
      label: 'Cancel session',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'warning',
      group: 'danger',
      onClick: handlers.onCancel,
      hidden: (session) => !canCancel(session.status),
    });
  }

  // Delete session - only when in terminal state
  if (handlers.onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete session',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      group: 'danger',
      onClick: handlers.onDelete,
      hidden: (session) => !canDelete(session.status),
    });
  }

  return actions;
}
