/**
 * useMediaCapture Hook
 *
 * Handles media stream capture (start/stop) operations.
 * Extracted from useLocalMedia for single responsibility.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { mediaCaptureService } from '../services/media-capture.service';
import type { MediaError } from '../types/media.types';

// =============================================================================
// Types
// =============================================================================

export interface UseMediaCaptureOptions {
  /** Audio enabled by default when capturing */
  audioEnabled?: boolean;
  /** Video enabled by default when capturing */
  videoEnabled?: boolean;
}

export interface UseMediaCaptureReturn {
  /** Start capturing media */
  startCapture: (options?: { audio?: boolean; video?: boolean }) => Promise<void>;
  /** Stop all media capture */
  stopCapture: () => void;
  /** Whether capture is in progress */
  isCapturing: boolean;
  /** Current capture error */
  error: MediaError | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useMediaCapture(options: UseMediaCaptureOptions = {}): UseMediaCaptureReturn {
  const { audioEnabled = true, videoEnabled = true } = options;

  // Store selectors
  const localStream = useMediaStore((s) => s.localStream);
  const selectedAudioInput = useMediaStore((s) => s.selectedAudioInput);
  const selectedVideoInput = useMediaStore((s) => s.selectedVideoInput);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const setLocalAudioTrack = useMediaStore((s) => s.setLocalAudioTrack);
  const setLocalVideoTrack = useMediaStore((s) => s.setLocalVideoTrack);
  const setAudioEnabledStore = useMediaStore((s) => s.setAudioEnabled);
  const setVideoEnabledStore = useMediaStore((s) => s.setVideoEnabled);
  const setVideoInitializationFailed = useMediaStore((s) => s.setVideoInitializationFailed);
  const setAudioInitializationFailed = useMediaStore((s) => s.setAudioInitializationFailed);
  const clearInitializationErrors = useMediaStore((s) => s.clearInitializationErrors);
  const stopAllTracks = useMediaStore((s) => s.stopAllTracks);

  // Local refs
  const isCapturingRef = useRef(false);
  const errorRef = useRef<MediaError | null>(null);
  const mountedRef = useRef(true);

  const startCapture = useCallback(
    async (captureOptions?: { audio?: boolean; video?: boolean }) => {
      if (isCapturingRef.current || localStream) return;

      isCapturingRef.current = true;
      errorRef.current = null;

      const requestingAudio = captureOptions?.audio ?? audioEnabled;
      const requestingVideo = captureOptions?.video ?? videoEnabled;

      try {
        const result = await mediaCaptureService.capture({
          audio: requestingAudio,
          video: requestingVideo,
          audioDeviceId: selectedAudioInput ?? undefined,
          videoDeviceId: selectedVideoInput ?? undefined,
        });

        if (!mountedRef.current) {
          mediaCaptureService.stopStream(result.stream);
          return;
        }

        clearInitializationErrors();

        setLocalStream(result.stream);
        setLocalAudioTrack(result.audioTrack);
        setLocalVideoTrack(result.videoTrack);

        if (result.audioTrack) {
          result.audioTrack.enabled = requestingAudio;
          setAudioEnabledStore(requestingAudio);
        }
        if (result.videoTrack) {
          result.videoTrack.enabled = requestingVideo;
          setVideoEnabledStore(requestingVideo);
        }
      } catch (error) {
        const mediaError = error as MediaError;
        errorRef.current = mediaError;

        if (requestingVideo) {
          setVideoInitializationFailed(true, mediaError.message);
        }
        if (requestingAudio) {
          setAudioInitializationFailed(true, mediaError.message);
        }

        throw error;
      } finally {
        isCapturingRef.current = false;
      }
    },
    [
      localStream,
      audioEnabled,
      videoEnabled,
      selectedAudioInput,
      selectedVideoInput,
      setLocalStream,
      setLocalAudioTrack,
      setLocalVideoTrack,
      setAudioEnabledStore,
      setVideoEnabledStore,
      setVideoInitializationFailed,
      setAudioInitializationFailed,
      clearInitializationErrors,
    ]
  );

  const stopCapture = useCallback(() => {
    stopAllTracks();
    clearInitializationErrors();
    errorRef.current = null;
  }, [stopAllTracks, clearInitializationErrors]);

  // Track mounted state for async operations
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    startCapture,
    stopCapture,
    isCapturing: isCapturingRef.current,
    error: errorRef.current,
  };
}
