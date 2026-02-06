/**
 * useSessionSubscriptions Hook
 *
 * Manages all WebSocket subscriptions for the session room.
 * Extracted from SessionRoomContent to improve separation of concerns.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSubscription, useWebSocket, getWebSocketService } from '@/features/realtime';
import type { SessionSnapshotPayload, ServerMessagePayloads } from '@/features/realtime/types/messages';
import { useSessionStore } from '@/shared/stores/session.store';
import { useComplianceHistoryStore } from '@/features/compliance';
import { queryKeys } from '@/shared/services/query-keys';
import { logger } from '@/shared/lib/logger';
import {
  mapSnapshotToSession,
  mapSnapshotParticipants,
  mapRolePermissionsToParticipantPermissions,
} from '../utils/sessionRoomHelpers';

// =============================================================================
// Types
// =============================================================================

export interface UseSessionSubscriptionsOptions {
  /** Current session ID */
  sessionId: string;

  /** Called when snapshot is received (for session.ready timing) */
  onSnapshotReceived?: () => void;
}

export interface UseSessionSubscriptionsResult {
  /** Whether the initial snapshot has been received */
  hasSnapshot: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useSessionSubscriptions({
  sessionId,
  onSnapshotReceived,
}: UseSessionSubscriptionsOptions): UseSessionSubscriptionsResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasSnapshot, setHasSnapshot] = useState(false);

  // WebSocket connection management
  const { disconnect, markSessionJoined, resetSessionState } = useWebSocket();

  // Session store selectors
  const roleConfig = useSessionStore((state) => state.roleConfig);
  const sessionFromStore = useSessionStore((state) => state.session);

  // Session store actions
  const setSession = useSessionStore((state) => state.setSession);
  const setParticipants = useSessionStore((state) => state.setParticipants);
  const addParticipant = useSessionStore((state) => state.addParticipant);
  const updateParticipant = useSessionStore((state) => state.updateParticipant);
  const removeParticipant = useSessionStore((state) => state.removeParticipant);
  const setLocalParticipantId = useSessionStore((state) => state.setLocalParticipantId);
  const updateParticipantConnection = useSessionStore((state) => state.updateParticipantConnection);
  const updateParticipantMedia = useSessionStore((state) => state.updateParticipantMedia);
  const setRoleConfig = useSessionStore((state) => state.setRoleConfig);
  const setIceServers = useSessionStore((state) => state.setIceServers);
  const reset = useSessionStore((state) => state.reset);

  // Compliance history store
  const clearComplianceHistory = useComplianceHistoryStore((state) => state.clearHistory);

  // Cleanup function for session end scenarios
  const cleanupAndNavigate = useCallback(() => {
    resetSessionState();
    disconnect();
    reset();
    clearComplianceHistory();
    navigate({ to: '/sessions' });
  }, [resetSessionState, disconnect, reset, clearComplianceHistory, navigate]);

  // ===========================================================================
  // Session Snapshot (initial state)
  // ===========================================================================

  useSubscription('session.snapshot', (payload: SessionSnapshotPayload) => {
    const sessionFromSnapshot = mapSnapshotToSession(payload);
    setSession(sessionFromSnapshot);

    const participantsFromSnapshot = mapSnapshotParticipants(
      payload.participants,
      payload.sessionId,
      payload.roleConfig,
      payload.config
    );
    setParticipants(participantsFromSnapshot);

    setRoleConfig(payload.roleConfig);

    // Store ICE servers if provided (for WebRTC TURN relay)
    if (payload.iceServers?.length) {
      const servers: RTCIceServer[] = payload.iceServers.map((s) => ({
        urls: typeof s.urls === 'string' ? s.urls : [...s.urls],
        username: s.username,
        credential: s.credential,
      }));
      setIceServers(servers, payload.iceServersExpiresAt ?? '');
    }

    setHasSnapshot(true);
    onSnapshotReceived?.();

    // Use localParticipantId from snapshot (backend always provides this for the joining user)
    // Fallback to stored ID only if snapshot doesn't include it (backward compat)
    const storedLocalId = useSessionStore.getState().localParticipantId;
    if (!storedLocalId) {
      if (payload.localParticipantId) {
        setLocalParticipantId(payload.localParticipantId);
      }
    }

    const resolvedLocalId = payload.localParticipantId ?? storedLocalId ?? useSessionStore.getState().localParticipantId;
    const localParticipant = payload.participants.find((p) => p.id === resolvedLocalId);
    markSessionJoined(localParticipant?.connectionId);

    logger.info('Session snapshot received', {
      sessionId: payload.sessionId,
      participantCount: payload.participants.length,
      roleId: payload.roleConfig.roleId,
    });

    // Replay missed events that occurred during disconnection
    if (payload.missedEvents?.length) {
      logger.info('Replaying missed events', { count: payload.missedEvents.length });

      // Sort by serverSeq to ensure correct ordering
      const sortedEvents = [...payload.missedEvents].sort(
        (a, b) => (a.serverSeq ?? 0) - (b.serverSeq ?? 0)
      );

      const wsService = getWebSocketService();
      if (wsService) {
        for (const event of sortedEvents) {
          wsService.dispatchEvent(
            event.type as keyof ServerMessagePayloads,
            event.payload as ServerMessagePayloads[keyof ServerMessagePayloads]
          );
        }
      }
    }
  });

  // ===========================================================================
  // Participant Events
  // ===========================================================================

  useSubscription('session.participant.joined', (payload) => {
    const permissions = mapRolePermissionsToParticipantPermissions(
      payload.rolePermissions ?? roleConfig?.permissions
    );

    const participant = {
      id: payload.participantId,
      userId: payload.userId ?? payload.participantId,
      sessionId,
      displayName: payload.displayName,
      avatarUrl: payload.avatarUrl,
      role: {
        name: payload.roleId,
        displayName: payload.roleName ?? payload.roleId,
        permissions,
      },
      connectionState: 'connected' as const,
      mediaState: {
        audioEnabled: false,
        videoEnabled: false,
        screenShareEnabled: false,
        isSpeaking: false,
      },
      joinedAt: payload.joinedAt,
    };
    addParticipant(participant);
    toast.info(`${payload.displayName} joined`);
  });

  useSubscription('session.participant.left', (payload) => {
    removeParticipant(payload.participantId);
  });

  useSubscription('session.participant.updated', (payload) => {
    const { participantId, changes } = payload;

    if (changes.connectionState) {
      updateParticipantConnection(participantId, changes.connectionState);
    }
    if (changes.mediaState) {
      updateParticipantMedia(participantId, changes.mediaState);
    }

    const { connectionState: _, mediaState: __, ...otherChanges } = changes;
    if (Object.keys(otherChanges).length > 0) {
      updateParticipant(participantId, otherChanges as Parameters<typeof updateParticipant>[1]);
    }
  });

  // ===========================================================================
  // Media Events
  // ===========================================================================

  useSubscription('media.state.changed', (payload) => {
    const { participantId, kind, enabled } = payload;

    // Convert kind to MediaState property name
    const mediaStateUpdate: Record<string, boolean> = {};
    if (kind === 'audio') mediaStateUpdate.audioEnabled = enabled;
    else if (kind === 'video') mediaStateUpdate.videoEnabled = enabled;
    else if (kind === 'screen') mediaStateUpdate.screenShareEnabled = enabled;

    updateParticipantMedia(participantId, mediaStateUpdate);
  });

  // Handle screen share status updates from server
  useSubscription('media.screenShare.status', (payload) => {
    const { participantId, isSharing } = payload;
    updateParticipantMedia(participantId, { screenShareEnabled: isSharing });
  });

  // ===========================================================================
  // Outcome Events
  // ===========================================================================

  useSubscription('outcome.ready', (payload) => {
    logger.info('Outcome ready', { outcomeId: payload.outcomeId, type: payload.type });
    // Invalidate TanStack Query to refetch outcome data
    void queryClient.invalidateQueries({
      queryKey: queryKeys.outcomes.bySession(sessionId),
    });
  });

  useSubscription('outcome.updated', (payload) => {
    logger.info('Outcome updated', { outcomeId: payload.outcomeId, status: payload.status });
    // Invalidate TanStack Query to refetch outcome data
    void queryClient.invalidateQueries({
      queryKey: queryKeys.outcomes.bySession(sessionId),
    });
  });

  // ===========================================================================
  // Error Events
  // ===========================================================================

  useSubscription('error', (payload) => {
    if (payload.code === 'WS_TARGET_NOT_CONNECTED') {
      logger.debug('Ignoring non-fatal signaling error', payload);
      return;
    }
    toast.error(payload.message || 'An error occurred');
  });

  // ===========================================================================
  // Session Lifecycle Events
  // ===========================================================================

  useSubscription('session.completed', (payload) => {
    logger.info('Session completed', { sessionId: payload.sessionId, duration: payload.duration });
    toast.info('Session has ended');
    cleanupAndNavigate();
  });

  useSubscription('session.status.changed', (payload) => {
    logger.info('Session status changed', { status: payload.status, reason: payload.reason });

    // Update session status in store
    if (sessionFromStore) {
      setSession({ ...sessionFromStore, status: payload.status });
    }

    // Handle terminal states
    if (payload.status === 'ended') {
      toast.info(payload.reason || 'Session has ended');
      cleanupAndNavigate();
    }
  });

  useSubscription('session.left', (payload) => {
    logger.info('Session left notification', { reason: payload.reason });

    const messages: Record<string, string> = {
      kicked: 'You have been removed from the session',
      session_ended: 'The session has ended',
      user_left: 'You have left the session',
      error: payload.message || 'An error occurred',
    };

    toast.info(messages[payload.reason] || 'Disconnected from session');
    cleanupAndNavigate();
  });

  return { hasSnapshot };
}
