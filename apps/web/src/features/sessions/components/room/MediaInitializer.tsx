/**
 * MediaInitializer
 *
 * Config-driven media initialization wrapper.
 * Uses React 19 useTransition for non-blocking permission requests.
 * Only initializes media when modules are enabled and user has permissions.
 */

import { useEffect, useTransition, useRef, useState, type ReactNode } from 'react';
import { useLocalMedia, useMediaDevices, useWebRTC } from '@/features/media';
import { useSend } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { useSessionPermissions } from '../../hooks/useSessionPermissions';
import { useSessionConfig } from '../../hooks/useSessionConfig';
import { logger } from '@/shared/lib/logger';

export interface MediaInitializerProps {
  /** Child components to render after initialization */
  children: ReactNode;
  /** Callback when media error occurs */
  onError?: (error: Error) => void;
  /** Callback when media is ready */
  onReady?: () => void;
}

export function MediaInitializer({
  children,
  onError,
  onReady,
}: MediaInitializerProps) {
  const [, startTransition] = useTransition();
  const initAttemptedRef = useRef(false);
  const mountedRef = useRef(true);
  const hasCalledOnReadyRef = useRef(false);

  // Track when media capture is complete (or skipped)
  const [mediaReady, setMediaReady] = useState(false);

  // Session state
  const localParticipantId = useSessionStore((s) => s.localParticipantId);
  const localParticipant = useSessionStore((s) => s.getLocalParticipant());
  const updateParticipantMedia = useSessionStore((s) => s.updateParticipantMedia);

  // User media preferences (set in lobby)
  const isAudioEnabled = useMediaStore((s) => s.isAudioEnabled);
  const isVideoEnabled = useMediaStore((s) => s.isVideoEnabled);

  // Permission checks
  const { canPublishAudio, canPublishVideo } = useSessionPermissions();

  // Config checks
  const { canPublishMedia, isModuleEnabled } = useSessionConfig();

  // Media hooks
  const { startCapture, error: mediaError } = useLocalMedia();

  const { requestPermissions } = useMediaDevices();
  const send = useSend();

  // WebRTC hook - pass mediaReady so it waits for media capture before initializing
  // This ensures the local stream is available when WebRTC negotiation begins
  useWebRTC({ mediaReady });

  // Determine what to initialize based on config, permissions, AND user preferences
  // Only request permissions for media the user has enabled
  const shouldInitAudio =
    isAudioEnabled && canPublishAudio && isModuleEnabled('audio');
  const shouldInitVideo =
    isVideoEnabled && canPublishVideo && isModuleEnabled('video');
  const shouldInitMedia =
    canPublishMedia && (shouldInitAudio || shouldInitVideo);

  // Initialize media when participant joins and config allows
  useEffect(() => {
    // Guard: only init once and when we have a participant
    if (initAttemptedRef.current || !localParticipantId || !localParticipant) {
      return;
    }

    // If user disabled all media, mark as ready without requesting permissions
    if (!shouldInitMedia) {
      initAttemptedRef.current = true;
      logger.info('[MediaInitializer] User disabled all media, skipping permissions');
      setMediaReady(true);
      return;
    }

    initAttemptedRef.current = true;

    // Use startTransition for non-blocking permission request
    startTransition(() => {
      (async () => {
        try {
          logger.info('[MediaInitializer] Requesting media permissions', {
            audio: shouldInitAudio,
            video: shouldInitVideo,
          });

          const granted = await requestPermissions(
            shouldInitAudio,
            shouldInitVideo
          );

          if (!mountedRef.current) return;

          if (granted) {
            logger.info(
              '[MediaInitializer] Permissions granted, starting capture'
            );
            await startCapture({
              audio: shouldInitAudio,
              video: shouldInitVideo,
            });

            if (mountedRef.current) {
              const { isAudioEnabled: audioEnabledNow, isVideoEnabled: videoEnabledNow } =
                useMediaStore.getState();
              const audioEnabled =
                audioEnabledNow && canPublishAudio && isModuleEnabled('audio');
              const videoEnabled =
                videoEnabledNow && canPublishVideo && isModuleEnabled('video');

              if (localParticipantId) {
                updateParticipantMedia(localParticipantId, {
                  audioEnabled,
                  videoEnabled,
                });
              }
              if (canPublishAudio && isModuleEnabled('audio')) {
                send('media.toggle', { kind: 'audio', enabled: audioEnabled }).catch(() => {
                  // Non-fatal: local state is already updated
                });
              }
              if (canPublishVideo && isModuleEnabled('video')) {
                send('media.toggle', { kind: 'video', enabled: videoEnabled }).catch(() => {
                  // Non-fatal: local state is already updated
                });
              }
              // Signal that media capture is complete - WebRTC can now initialize
              setMediaReady(true);
            }
          } else {
            logger.warn('[MediaInitializer] Permissions denied');
            setMediaReady(true);
            onError?.(new Error('Media permissions denied'));
          }
        } catch (err) {
          logger.error('[MediaInitializer] Media initialization failed', err);
          if (mountedRef.current) {
            setMediaReady(true);
            onError?.(err as Error);
          }
        }
      })();
    });

    // NOTE: No cleanup function here. mountedRef is managed by the dedicated
    // mount-tracking effect below (lines ~200-205). Previously, this cleanup
    // set mountedRef.current = false, which caused a race condition: when
    // startCapture() updates the media store, the startCapture callback gets
    // a new reference (localStream dep changes), triggering this effect's
    // cleanup before the async IIFE completes — falsely marking the component
    // as unmounted and preventing setMediaReady(true) from ever executing.
  }, [
    localParticipantId,
    localParticipant,
    shouldInitMedia,
    shouldInitAudio,
    shouldInitVideo,
    canPublishAudio,
    canPublishVideo,
    isModuleEnabled,
    requestPermissions,
    startCapture,
    onError,
    updateParticipantMedia,
    send,
  ]);

  // Call onReady when media is ready (session.ready is independent of WebRTC init)
  // WebRTC initializes independently via useWebRTC hook above
  useEffect(() => {
    if (mediaReady && !hasCalledOnReadyRef.current) {
      hasCalledOnReadyRef.current = true;
      logger.info('[MediaInitializer] Media ready, signaling session.ready');
      onReady?.();
    }
  }, [mediaReady, onReady]);

  // Forward media errors
  useEffect(() => {
    if (mediaError && mountedRef.current) {
      logger.error('[MediaInitializer] Media error', mediaError);
      onError?.(new Error(mediaError.message));
    }
  }, [mediaError, onError]);

  // Mount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return <>{children}</>;
}

MediaInitializer.displayName = 'MediaInitializer';
