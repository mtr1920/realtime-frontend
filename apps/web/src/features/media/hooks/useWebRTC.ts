/**
 * useWebRTC Hook
 *
 * Main orchestration hook for WebRTC:
 * - Initializes WebRTC service when session joins
 * - Manages peer connections based on participant list
 * - Syncs local media to all peers
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useWebRTCContext } from '../context/WebRTCContext';
import { useWebRTCStore } from '../stores/webrtc.store';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { useWebSocket } from '@/features/realtime';
import { logger } from '@/shared/lib/logger';
import type { PeerInfo, NetworkQualityLevel } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface UseWebRTCOptions {
  /** Observer mode - receive only, no local media transmission */
  isObserver?: boolean;
  /** Whether media capture is ready - WebRTC waits for this before auto-initializing (non-observers) */
  mediaReady?: boolean;
}

interface UseWebRTCReturn {
  // State
  isInitialized: boolean;
  peers: PeerInfo[];
  overallQuality: NetworkQualityLevel;

  // Actions
  initialize: () => void;
  shutdown: () => void;
  restartIce: (participantId: string) => Promise<void>;
  notifyMediaToggle: (kind: 'audio' | 'video', enabled: boolean) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { isObserver = false, mediaReady = false } = options;
  const {
    isInitialized,
    initialize: contextInitialize,
    shutdown,
    setLocalStream,
    connectToParticipant,
    disconnectFromParticipant,
    service,
  } = useWebRTCContext();

  // Session store - subscribe to the Map directly for proper reactivity
  const localParticipantId = useSessionStore((s) => s.localParticipantId);
  const participantsMap = useSessionStore((s) => s.participants);

  // Media store
  const localStream = useMediaStore((s) => s.localStream);

  // WebSocket connection state - WebRTC depends on WebSocket being connected
  const { connectionState: wsConnectionState } = useWebSocket();

  // WebRTC store - subscribe to the Map directly for proper reactivity
  const peersMap = useWebRTCStore((s) => s.peers);
  const getOverallQuality = useWebRTCStore((s) => s.getOverallQuality);

  // Memoize the arrays to prevent unnecessary effect re-runs
  // Only recreate when the Map reference changes (indicating actual data change)
  const participantsList = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap]
  );
  const peersList = useMemo(() => Array.from(peersMap.values()), [peersMap]);

  // Initialize WebRTC when we have a local participant ID and WebSocket is connected
  const initialize = useCallback(() => {
    if (localParticipantId && !isInitialized && wsConnectionState === 'connected') {
      contextInitialize(localParticipantId, isObserver);
    }
  }, [localParticipantId, isInitialized, wsConnectionState, contextInitialize, isObserver]);

  // Auto-initialize when local participant ID is available AND WebSocket is connected
  // For non-observers, also wait for media capture to be ready to ensure streams
  // are available before WebRTC negotiation begins
  useEffect(() => {
    const canInitialize =
      localParticipantId &&
      !isInitialized &&
      wsConnectionState === 'connected' &&
      (isObserver || mediaReady); // Observers don't need media; others wait for it

    if (canInitialize) {
      initialize();
    }
  }, [localParticipantId, isInitialized, wsConnectionState, initialize, isObserver, mediaReady]);

  // Sync local stream to WebRTC service
  useEffect(() => {
    if (isInitialized) {
      setLocalStream(localStream);
    }
  }, [isInitialized, localStream, setLocalStream]);

  // Connect to participants when they join
  // Uses reactive participantsList and peersList to trigger re-runs when data changes
  useEffect(() => {
    if (!isInitialized || !localParticipantId) return;

    const currentPeerIds = new Set(peersList.map((p) => p.participantId));

    // Connect to new participants (only ACTIVE/connected participants)
    for (const participant of participantsList) {
      // Skip self
      if (participant.id === localParticipantId) continue;
      // Skip participants that are not connected yet
      if (participant.connectionState !== 'connected') continue;

      // Connect if not already connected
      if (!currentPeerIds.has(participant.id)) {
        connectToParticipant(participant.id).catch((err) => {
          logger.error(`Failed to connect to participant ${participant.id}:`, err);
        });
      }
    }

    // Disconnect from participants who left
    const activeParticipantIds = new Set(
      participantsList
        .filter((participant) => participant.connectionState === 'connected')
        .map((participant) => participant.id)
    );
    for (const peer of peersList) {
      if (!activeParticipantIds.has(peer.participantId)) {
        disconnectFromParticipant(peer.participantId);
      }
    }
  }, [
    isInitialized,
    localParticipantId,
    participantsList,
    peersList,
    connectToParticipant,
    disconnectFromParticipant,
  ]);

  // Restart ICE for a specific peer
  const restartIce = useCallback(
    async (participantId: string) => {
      await service?.restartIce(participantId);
    },
    [service]
  );

  // Notify media toggle
  const notifyMediaToggle = useCallback(
    async (kind: 'audio' | 'video', enabled: boolean) => {
      await service?.notifyMediaToggle(kind, enabled);
    },
    [service]
  );

  return {
    isInitialized,
    peers: peersList,
    overallQuality: getOverallQuality(),
    initialize,
    shutdown,
    restartIce,
    notifyMediaToggle,
  };
}
