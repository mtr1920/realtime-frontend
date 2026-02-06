/**
 * ObserverWebRTCInitializer
 *
 * Lightweight WebRTC initialization for observers (receive-only mode).
 * Unlike MediaInitializer, this skips media capture permissions and only
 * initializes WebRTC to receive remote streams from other participants.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { useWebRTC } from '@/features/media';
import { useSessionStore } from '@/shared/stores/session.store';
import { logger } from '@/shared/lib/logger';

export interface ObserverWebRTCInitializerProps {
  /** Child components to render after initialization */
  children: ReactNode;
  /** Callback when WebRTC is ready */
  onReady?: () => void;
}

export function ObserverWebRTCInitializer({
  children,
  onReady,
}: ObserverWebRTCInitializerProps) {
  const readyCalledRef = useRef(false);

  // Session state
  const localParticipantId = useSessionStore((s) => s.localParticipantId);

  // Initialize WebRTC for receiving streams only (observer mode)
  // Observers don't send local media, only receive from other participants
  const { isInitialized } = useWebRTC({ isObserver: true });

  // Notify when ready
  useEffect(() => {
    if (isInitialized && localParticipantId && !readyCalledRef.current) {
      readyCalledRef.current = true;
      logger.info('[ObserverWebRTCInitializer] WebRTC initialized for observer');
      onReady?.();
    }
  }, [isInitialized, localParticipantId, onReady]);

  return <>{children}</>;
}

ObserverWebRTCInitializer.displayName = 'ObserverWebRTCInitializer';
