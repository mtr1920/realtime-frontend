/**
 * Session Room Helpers
 *
 * Utility functions for mapping session data between API and store formats.
 */

import type {
  SessionSnapshotPayload,
  ParticipantSnapshot,
  ParticipantRolePermissionsSnapshot,
  RolePermissionsSnapshot,
  SessionConfigSnapshot,
} from '@/features/realtime/types/messages';
import type { PublicRoleConfig, RolePermissions } from '@protocol/index';

// =============================================================================
// Default Permissions
// =============================================================================

/**
 * Default participant permissions (fallback when roleConfig not available).
 * Default to allowing media since most participants can publish.
 * Observer roles will have these overridden by roleConfig.permissions.
 */
export const DEFAULT_PARTICIPANT_PERMISSIONS = {
  canPublishAudio: true,
  canPublishVideo: true,
  canScreenShare: true,
  canInteractWithAI: true,
  canEndSession: false,
  canViewComplianceData: false,
  canRemoveParticipants: false,
  canStartRecording: false,
  canViewTranscript: false,
  canChat: true,
  // Communication
  canSendPrivateMessages: false,
  // Outcome permissions
  canViewOutcome: false,
  canEditOutcome: false,
  canApproveOutcome: false,
  // Phase control
  canAdvancePhase: false,
  canRevertPhase: false,
};

// =============================================================================
// Snapshot Mapping Helpers
// =============================================================================

/**
 * Map a session snapshot payload to the session store format
 */
export function mapSnapshotToSession(snapshot: SessionSnapshotPayload) {
  return {
    id: snapshot.sessionId,
    tenantId: '', // Not included in snapshot, will be filled from API
    workspaceId: '', // Not included in snapshot, will be filled from API
    status: snapshot.status,
    title: `Session ${snapshot.sessionId.slice(0, 8)}`,
    scheduledStartTime: snapshot.startedAt ?? undefined,
    actualStartTime: snapshot.startedAt ?? undefined,
    endTime: undefined,
    config: {
      domainType: snapshot.config?.domainType ?? 'default',
      enabledModules: ['chat'],
      recording: {
        enabled: snapshot.config?.modules?.recording ?? false,
        autoStart: false,
      },
      ai: {
        enabled: snapshot.config?.modules?.ai ?? false,
        provider: undefined,
      },
      compliance: {
        enabled: snapshot.config?.modules?.compliance ?? false,
        browserLock: false,
        identityVerification: false,
      },
    },
    createdAt: snapshot.startedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Map RolePermissions (from PublicRoleConfig) to ParticipantRole.permissions format.
 * The two schemas have slightly different field names.
 */
type SnapshotRolePermissions =
  | RolePermissions
  | RolePermissionsSnapshot
  | ParticipantRolePermissionsSnapshot
  | null
  | undefined;

export function mapRolePermissionsToParticipantPermissions(
  rolePermissions: SnapshotRolePermissions
) {
  if (!rolePermissions) {
    return DEFAULT_PARTICIPANT_PERMISSIONS;
  }

  if ('canSendMessages' in rolePermissions) {
    return {
      canPublishAudio: rolePermissions.canPublishAudio ?? false,
      canPublishVideo: rolePermissions.canPublishVideo ?? false,
      canScreenShare: rolePermissions.canShareScreen ?? false,
      canInteractWithAI: rolePermissions.canInteractWithAI ?? false,
      canEndSession: rolePermissions.canEndSession ?? false,
      canViewComplianceData: rolePermissions.canViewComplianceData ?? false,
      canRemoveParticipants: rolePermissions.canRemoveParticipants ?? false,
      canStartRecording: false, // Not in RolePermissions, default false
      canViewTranscript: rolePermissions.canViewTranscripts ?? false,
      canChat: rolePermissions.canSendMessages ?? true,
      // Communication
      canSendPrivateMessages: rolePermissions.canSendPrivateMessages ?? false,
      // Outcome permissions
      canViewOutcome: rolePermissions.canViewOutcome ?? false,
      canEditOutcome: rolePermissions.canEditOutcome ?? false,
      canApproveOutcome: rolePermissions.canApproveOutcome ?? false,
      // Phase control
      canAdvancePhase: rolePermissions.canAdvancePhase ?? false,
      canRevertPhase: rolePermissions.canRevertPhase ?? false,
    };
  }

  // Handle both RolePermissionsSnapshot (canShareScreen) and ParticipantRolePermissionsSnapshot (canScreenShare)
  const canScreenShare =
    'canShareScreen' in rolePermissions
      ? rolePermissions.canShareScreen ?? false
      : rolePermissions.canScreenShare ?? false;

  return {
    canPublishAudio: rolePermissions.canPublishAudio ?? false,
    canPublishVideo: rolePermissions.canPublishVideo ?? false,
    canScreenShare,
    canInteractWithAI: rolePermissions.canInteractWithAI ?? false,
    canEndSession: rolePermissions.canEndSession ?? false,
    canViewComplianceData: rolePermissions.canViewComplianceData ?? false,
    canRemoveParticipants: rolePermissions.canRemoveParticipants ?? false,
    canStartRecording: rolePermissions.canStartRecording ?? false,
    canViewTranscript: rolePermissions.canViewTranscript ?? false,
    canChat: rolePermissions.canChat ?? true,
    // Communication
    canSendPrivateMessages: rolePermissions.canSendPrivateMessages ?? false,
    // Outcome permissions
    canViewOutcome: rolePermissions.canViewOutcome ?? false,
    canEditOutcome: rolePermissions.canEditOutcome ?? false,
    canApproveOutcome: rolePermissions.canApproveOutcome ?? false,
    // Phase control
    canAdvancePhase: rolePermissions.canAdvancePhase ?? false,
    canRevertPhase: rolePermissions.canRevertPhase ?? false,
  };
}

/**
 * Map participant snapshots to the participant store format
 */
export function mapSnapshotParticipants(
  snapshots: ParticipantSnapshot[],
  sessionId: string,
  roleConfig: PublicRoleConfig | null | undefined,
  configSnapshot?: SessionConfigSnapshot
) {
  const roleLookup = new Map(configSnapshot?.roles?.map((role) => [role.id, role]) ?? []);

  return snapshots.map((p) => ({
    id: p.id,
    userId: p.userId ?? p.id, // Use participant ID as fallback for userId
    sessionId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    role: {
      name: p.roleId,
      displayName: p.roleName ?? roleLookup.get(p.roleId)?.name ?? p.roleId,
      permissions: mapRolePermissionsToParticipantPermissions(
        p.rolePermissions ??
          roleLookup.get(p.roleId)?.permissions ??
          roleConfig?.permissions
      ),
    },
    // A participant is considered 'connected' if:
    // 1. They are ACTIVE (sent session.ready), OR
    // 2. They have a connectionId (they're connected to WebSocket, just haven't sent session.ready yet)
    // This ensures WebRTC connections can be established while waiting for session.ready
    connectionState:
      p.status === 'ACTIVE' || p.connectionId
        ? ('connected' as const)
        : ('connecting' as const),
    mediaState: {
      audioEnabled: p.mediaState?.audioEnabled ?? false,
      videoEnabled: p.mediaState?.videoEnabled ?? false,
      screenShareEnabled: p.mediaState?.screenShareEnabled ?? false,
      isSpeaking: false,
    },
    joinedAt: p.joinedAt ?? new Date().toISOString(),
  }));
}

/**
 * Map API session status to protocol session status
 */
export function mapApiStatusToProtocol(
  apiStatus: string
): 'scheduled' | 'lobby' | 'active' | 'paused' | 'ended' {
  switch (apiStatus) {
    case 'CREATED':
    case 'WAITING':
      return 'lobby';
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'COMPLETED':
    case 'EXPIRED':
    case 'FAILED':
      return 'ended';
    default:
      return 'scheduled';
  }
}
