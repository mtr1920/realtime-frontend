/**
 * WebRTC Context
 *
 * Provides WebRTC functionality to components:
 * - WebRTC service instance
 * - Connection management
 * - Automatic cleanup
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import {
  createWebRTCService,
  destroyWebRTCService,
  type WebRTCService,
} from '../services/webrtc.service';
import { useWebRTCStore } from '../stores/webrtc.store';
import { logger } from '@/shared/lib/logger';
import type { PeerConnectionEvent, WebRTCConfig } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface WebRTCContextValue {
  service: WebRTCService | null;
  isInitialized: boolean;
  /** Initialize WebRTC. Pass isObserver=true for receive-only mode. */
  initialize: (localParticipantId: string, isObserver?: boolean) => void;
  shutdown: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenShareStream: (stream: MediaStream | null) => void;
  connectToParticipant: (participantId: string) => Promise<void>;
  disconnectFromParticipant: (participantId: string) => void;
}

interface WebRTCProviderProps {
  children: ReactNode;
  config?: WebRTCConfig;
}

// =============================================================================
// Context
// =============================================================================

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export function WebRTCProvider({ children, config }: WebRTCProviderProps) {
  // Store state & actions
  const isInitialized = useWebRTCStore((s) => s.isInitialized);
  const storeInitialize = useWebRTCStore((s) => s.initialize);
  const addPeer = useWebRTCStore((s) => s.addPeer);
  const removePeer = useWebRTCStore((s) => s.removePeer);
  const updatePeerConnectionState = useWebRTCStore(
    (s) => s.updatePeerConnectionState
  );
  const addRemoteTrack = useWebRTCStore((s) => s.addRemoteTrack);
  const removeRemoteTrack = useWebRTCStore((s) => s.removeRemoteTrack);
  const reset = useWebRTCStore((s) => s.reset);

  // Service ref (mutable to avoid re-renders)
  const serviceRef = useMemo(() => ({ current: null as WebRTCService | null }), []);

  // Handle WebRTC events
  const handleEvent = useCallback(
    (event: PeerConnectionEvent) => {
      switch (event.type) {
        case 'connected':
          updatePeerConnectionState(event.participantId, 'connected');
          break;
        case 'disconnected':
          updatePeerConnectionState(event.participantId, 'disconnected');
          break;
        case 'failed':
          updatePeerConnectionState(event.participantId, 'failed');
          break;
        case 'trackAdded':
          addRemoteTrack(event.track);
          break;
        case 'trackRemoved':
          removeRemoteTrack(event.trackId);
          break;
        case 'statsUpdated':
          // Handled separately by stats monitor
          break;
      }
    },
    [updatePeerConnectionState, addRemoteTrack, removeRemoteTrack]
  );

  // Initialize WebRTC service
  const initialize = useCallback(
    (localParticipantId: string, isObserver = false) => {
      if (serviceRef.current) {
        return; // Already initialized
      }

      const service = createWebRTCService({
        localParticipantId,
        config,
        onEvent: handleEvent,
        isObserver,
      });

      try {
        service.start();
      } catch (err) {
        logger.warn('[WebRTCContext] service.start() failed, will retry on reconnect', err);
      }
      serviceRef.current = service;
      storeInitialize(localParticipantId);
    },
    [config, handleEvent, storeInitialize, serviceRef]
  );

  // Shutdown WebRTC service
  const shutdown = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
      destroyWebRTCService();
      serviceRef.current = null;
      reset();
    }
  }, [reset, serviceRef]);

  // Set local stream
  const setLocalStream = useCallback(
    (stream: MediaStream | null) => {
      serviceRef.current?.setLocalStream(stream);
    },
    [serviceRef]
  );

  // Set screen share stream
  const setScreenShareStream = useCallback(
    (stream: MediaStream | null) => {
      serviceRef.current?.setScreenShareStream(stream);
    },
    [serviceRef]
  );

  // Connect to participant
  const connectToParticipant = useCallback(
    async (participantId: string) => {
      if (!serviceRef.current) return;

      await serviceRef.current.connectToParticipant(participantId);

      // Add peer to store
      addPeer({
        participantId,
        displayName: '',
        connectionState: 'connecting',
        iceConnectionState: 'new',
        isPolite: false, // Will be determined by service
        audioTrack: null,
        videoTrack: null,
        screenTrack: null,
      });
    },
    [addPeer, serviceRef]
  );

  // Disconnect from participant
  const disconnectFromParticipant = useCallback(
    (participantId: string) => {
      serviceRef.current?.disconnectFromParticipant(participantId);
      removePeer(participantId);
    },
    [removePeer, serviceRef]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shutdown();
    };
  }, [shutdown]);

  const contextValue = useMemo<WebRTCContextValue>(
    () => ({
      service: serviceRef.current,
      isInitialized,
      initialize,
      shutdown,
      setLocalStream,
      setScreenShareStream,
      connectToParticipant,
      disconnectFromParticipant,
    }),
    [
      isInitialized,
      initialize,
      shutdown,
      setLocalStream,
      setScreenShareStream,
      connectToParticipant,
      disconnectFromParticipant,
      serviceRef,
    ]
  );

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useWebRTCContext(): WebRTCContextValue {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
}
