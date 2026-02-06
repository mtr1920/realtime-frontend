/**
 * useScreenShare Hook
 *
 * Manages screen sharing:
 * - Start/stop screen capture
 * - Sync with WebRTC service
 * - Handle browser-initiated stop
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { useWebRTCContext } from '../context/WebRTCContext';
import { mediaCaptureService, stopStreamTracksWithCleanup } from '../services/media-capture.service';
import type { MediaError, ScreenShareOptions } from '../types/media.types';

// =============================================================================
// Types
// =============================================================================

interface UseScreenShareReturn {
  // State
  isScreenSharing: boolean;
  screenShareStream: MediaStream | null;
  error: MediaError | null;

  // Actions
  startScreenShare: (options?: ScreenShareOptions) => Promise<void>;
  stopScreenShare: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useScreenShare(): UseScreenShareReturn {
  // Media store
  const isScreenShareEnabled = useMediaStore((s) => s.isScreenShareEnabled);
  const screenShareStream = useMediaStore((s) => s.screenShareStream);
  const setScreenShareStream = useMediaStore((s) => s.setScreenShareStream);
  const setScreenShareEnabled = useMediaStore((s) => s.setScreenShareEnabled);

  // WebRTC context
  const { setScreenShareStream: setWebRTCScreenShare, isInitialized } =
    useWebRTCContext();

  // Error state
  const errorRef = useRef<MediaError | null>(null);
  const mountedRef = useRef(true);

  // Stop function (defined first so it can be used in startScreenShare)
  const stopScreenShare = useCallback(() => {
    // Stop all tracks and clear handlers
    stopStreamTracksWithCleanup(screenShareStream);

    setScreenShareStream(null);
    setScreenShareEnabled(false);

    // Sync with WebRTC service
    if (isInitialized) {
      setWebRTCScreenShare(null);
    }

    errorRef.current = null;
  }, [
    screenShareStream,
    setScreenShareStream,
    setScreenShareEnabled,
    setWebRTCScreenShare,
    isInitialized,
  ]);

  // Start screen share
  const startScreenShare = useCallback(
    async (options?: ScreenShareOptions) => {
      if (isScreenShareEnabled || screenShareStream) {
        return; // Already sharing
      }

      errorRef.current = null;

      try {
        const result = await mediaCaptureService.captureScreen(options);

        if (!mountedRef.current) {
          mediaCaptureService.stopStream(result.stream);
          return;
        }

        // Store the stream
        setScreenShareStream(result.stream);
        setScreenShareEnabled(true);

        // Sync with WebRTC service
        if (isInitialized) {
          setWebRTCScreenShare(result.stream);
        }

        // Listen for browser-initiated stop (user clicks "Stop sharing" in browser UI)
        const videoTrack = result.videoTrack;
        if (videoTrack) {
          videoTrack.onended = () => {
            if (mountedRef.current) {
              stopScreenShare();
            }
          };
        }
      } catch (error) {
        errorRef.current = error as MediaError;
        throw error;
      }
    },
    [
      isScreenShareEnabled,
      screenShareStream,
      setScreenShareStream,
      setScreenShareEnabled,
      setWebRTCScreenShare,
      isInitialized,
      stopScreenShare,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Clean up stream if component unmounts while sharing
      // Note: We intentionally stop here to prevent orphaned streams
      stopStreamTracksWithCleanup(screenShareStream);
    };
  }, [screenShareStream]);

  return {
    isScreenSharing: isScreenShareEnabled,
    screenShareStream,
    error: errorRef.current,
    startScreenShare,
    stopScreenShare,
  };
}
