/**
 * useSessionPermissions Hook
 *
 * Role-based permission checking for session actions.
 * Use this hook to check permissions - NEVER hardcode role checks.
 */

import { useMemo, useCallback } from 'react';
import { useSessionStore } from '@/shared/stores/session.store';
import type { ParticipantRole } from '@protocol/index';

/**
 * Session-level permission names
 */
export type SessionPermission =
  | 'canPublishAudio'
  | 'canPublishVideo'
  | 'canScreenShare'
  | 'canChat'
  | 'canEndSession'
  | 'canRemoveParticipants'
  | 'canStartRecording'
  | 'canViewTranscript'
  | 'canInteractWithAI'
  | 'canViewComplianceData'
  // Communication
  | 'canSendPrivateMessages'
  // Outcome permissions
  | 'canViewOutcome'
  | 'canEditOutcome'
  | 'canApproveOutcome'
  // Phase control
  | 'canAdvancePhase'
  | 'canRevertPhase';

export interface SessionPermissionsResult {
  /** Check if the local participant has a specific permission */
  hasPermission: (permission: SessionPermission) => boolean;

  /** Check if the local participant can publish audio */
  canPublishAudio: boolean;

  /** Check if the local participant can publish video */
  canPublishVideo: boolean;

  /** Check if the local participant can share screen */
  canScreenShare: boolean;

  /** Check if the local participant can chat */
  canChat: boolean;

  /** Check if the local participant can end the session */
  canEndSession: boolean;

  /** Check if the local participant can remove other participants */
  canRemoveParticipants: boolean;

  /** Check if the local participant can start recording */
  canStartRecording: boolean;

  /** Check if the local participant can view transcript */
  canViewTranscript: boolean;

  /** Check if the local participant can interact with AI */
  canInteractWithAI: boolean;

  /** Check if the local participant can view compliance data */
  canViewComplianceData: boolean;

  /** Check if the local participant can send private messages */
  canSendPrivateMessages: boolean;

  /** Check if the local participant can view outcomes */
  canViewOutcome: boolean;

  /** Check if the local participant can edit outcomes */
  canEditOutcome: boolean;

  /** Check if the local participant can approve outcomes */
  canApproveOutcome: boolean;

  /** Check if the local participant can advance session phase */
  canAdvancePhase: boolean;

  /** Check if the local participant can revert session phase */
  canRevertPhase: boolean;

  /** Check if the local participant has any facilitator permissions */
  isFacilitator: boolean;

  /** Get the local participant's role */
  role: ParticipantRole | undefined;

  /** Get the local participant's role name */
  roleName: string | undefined;

  /** Check if the local participant can moderate (end session or remove participants) */
  canModerate: boolean;

  /** Check if the local participant can control media (audio/video/screen) */
  canControlMedia: boolean;

  /** Check if the local participant can control session phases */
  canControlPhases: boolean;

  /** Check if the local participant can manage outcomes (view, edit, or approve) */
  canManageOutcome: boolean;
}

/**
 * Hook for checking session-level permissions
 *
 * @example
 * ```tsx
 * const { hasPermission, canEndSession, isFacilitator } = useSessionPermissions();
 *
 * return (
 *   <div>
 *     {hasPermission('canChat') && <ChatInput />}
 *     {canEndSession && <EndSessionButton />}
 *     {isFacilitator && <FacilitatorControls />}
 *   </div>
 * );
 * ```
 */
export function useSessionPermissions(): SessionPermissionsResult {
  const localParticipant = useSessionStore((state) => state.getLocalParticipant());

  const permissions = localParticipant?.role?.permissions;
  const role = localParticipant?.role;

  const hasPermission = useCallback(
    (permission: SessionPermission): boolean => {
      if (!permissions) return false;
      return permissions[permission] ?? false;
    },
    [permissions]
  );

  return useMemo(() => {
    const canPublishAudio = permissions?.canPublishAudio ?? false;
    const canPublishVideo = permissions?.canPublishVideo ?? false;
    const canScreenShare = permissions?.canScreenShare ?? false;
    const canChat = permissions?.canChat ?? false;
    const canEndSession = permissions?.canEndSession ?? false;
    const canRemoveParticipants = permissions?.canRemoveParticipants ?? false;
    const canStartRecording = permissions?.canStartRecording ?? false;
    const canViewTranscript = permissions?.canViewTranscript ?? false;
    const canInteractWithAI = permissions?.canInteractWithAI ?? false;
    const canViewComplianceData = permissions?.canViewComplianceData ?? false;

    // New permissions
    const canSendPrivateMessages = permissions?.canSendPrivateMessages ?? false;
    const canViewOutcome = permissions?.canViewOutcome ?? false;
    const canEditOutcome = permissions?.canEditOutcome ?? false;
    const canApproveOutcome = permissions?.canApproveOutcome ?? false;
    const canAdvancePhase = permissions?.canAdvancePhase ?? false;
    const canRevertPhase = permissions?.canRevertPhase ?? false;

    // A facilitator can end session or remove participants
    const isFacilitator = canEndSession || canRemoveParticipants || canStartRecording;

    // Can moderate = can end session or remove participants
    const canModerate = canEndSession || canRemoveParticipants;

    // Can control media = can publish any media type
    const canControlMedia = canPublishAudio || canPublishVideo || canScreenShare;

    // Can control phases = can advance or revert phase
    const canControlPhases = canAdvancePhase || canRevertPhase;

    // Can manage outcomes = can view, edit, or approve outcomes
    const canManageOutcome = canViewOutcome || canEditOutcome || canApproveOutcome;

    return {
      hasPermission,
      canPublishAudio,
      canPublishVideo,
      canScreenShare,
      canChat,
      canEndSession,
      canRemoveParticipants,
      canStartRecording,
      canViewTranscript,
      canInteractWithAI,
      canViewComplianceData,
      canSendPrivateMessages,
      canViewOutcome,
      canEditOutcome,
      canApproveOutcome,
      canAdvancePhase,
      canRevertPhase,
      isFacilitator,
      role,
      roleName: role?.name,
      canModerate,
      canControlMedia,
      canControlPhases,
      canManageOutcome,
    };
  }, [permissions, role, hasPermission]);
}

/**
 * Component that renders children only if the user has the specified permission
 */
export interface SessionPermissionGateProps {
  permission: SessionPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SessionPermissionGate({
  permission,
  children,
  fallback = null,
}: SessionPermissionGateProps) {
  const { hasPermission } = useSessionPermissions();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
