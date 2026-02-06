/**
 * useSessionReady Hook
 *
 * Manages the session.ready announcement logic.
 * Sends session.ready when all initialization conditions are met.
 */

import { useEffect } from 'react';
import { useWebSocket } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface UseSessionReadyOptions {
  /** Current session ID */
  sessionId: string;

  /** Whether the initial snapshot has been received */
  hasSnapshot: boolean;

  /** Whether media has been initialized */
  mediaInitialized: boolean;

  /** Whether media initialization failed */
  mediaInitFailed: boolean;

  /** Whether the current user is an observer */
  isObserver: boolean;

  /** Whether the session has video or audio modules enabled */
  hasMediaModule: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useSessionReady({
  sessionId,
  hasSnapshot,
  mediaInitialized,
  mediaInitFailed,
  isObserver,
  hasMediaModule,
}: UseSessionReadyOptions): void {
  const { connectionState, send } = useWebSocket();
  const hasAnnouncedReady = useSessionStore((state) => state.hasAnnouncedReady);
  const setHasAnnouncedReady = useSessionStore((state) => state.setHasAnnouncedReady);

  useEffect(() => {
    const snapshotReceived = hasSnapshot;
    const mediaReady = mediaInitialized || isObserver || !hasMediaModule;

    if (connectionState === 'connected' && snapshotReceived && mediaReady && !hasAnnouncedReady) {
      let mediaStatus: 'initialized' | 'skipped' | 'failed' = 'initialized';
      let skipReason: 'observer' | 'no_media_modules' | 'permissions_denied' | undefined;

      if (isObserver) {
        mediaStatus = 'skipped';
        skipReason = 'observer';
      } else if (!hasMediaModule) {
        mediaStatus = 'skipped';
        skipReason = 'no_media_modules';
      } else if (mediaInitFailed) {
        mediaStatus = 'failed';
        skipReason = 'permissions_denied';
      }

      send('session.ready', { mediaStatus, skipReason });
      setHasAnnouncedReady(true);

      logger.info('Session ready sent', { sessionId, mediaStatus, skipReason });
    }
  }, [
    connectionState,
    hasSnapshot,
    mediaInitialized,
    mediaInitFailed,
    isObserver,
    hasMediaModule,
    hasAnnouncedReady,
    send,
    setHasAnnouncedReady,
    sessionId,
  ]);
}
