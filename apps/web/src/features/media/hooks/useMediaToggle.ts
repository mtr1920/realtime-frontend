/**
 * useMediaToggle Hook
 *
 * Handles audio/video toggle and enable/disable operations.
 * Extracted from useLocalMedia for single responsibility.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { mediaCaptureService } from '../services/media-capture.service';
import type { MediaError } from '../types/media.types';
import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface UseMediaToggleReturn {
  /** Toggle audio on/off */
  toggleAudio: () => Promise<void>;
  /** Toggle video on/off */
  toggleVideo: () => Promise<void>;
  /** Set audio enabled state */
  setAudioEnabled: (enabled: boolean) => Promise<void>;
  /** Set video enabled state */
  setVideoEnabled: (enabled: boolean) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useMediaToggle(): UseMediaToggleReturn {
  // Store selectors
  const localStream = useMediaStore((s) => s.localStream);
  const localAudioTrack = useMediaStore((s) => s.localAudioTrack);
  const localVideoTrack = useMediaStore((s) => s.localVideoTrack);
  const isAudioEnabled = useMediaStore((s) => s.isAudioEnabled);
  const hasAudioPermission = useMediaStore((s) => s.hasAudioPermission);
  const hasVideoPermission = useMediaStore((s) => s.hasVideoPermission);
  const selectedAudioInput = useMediaStore((s) => s.selectedAudioInput);
  const selectedVideoInput = useMediaStore((s) => s.selectedVideoInput);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const setLocalAudioTrack = useMediaStore((s) => s.setLocalAudioTrack);
  const setLocalVideoTrack = useMediaStore((s) => s.setLocalVideoTrack);
  const setAudioEnabledStore = useMediaStore((s) => s.setAudioEnabled);
  const setVideoEnabledStore = useMediaStore((s) => s.setVideoEnabled);
  const setPermissions = useMediaStore((s) => s.setPermissions);
  const setPermissionError = useMediaStore((s) => s.setPermissionError);
  const setVideoInitializationFailed = useMediaStore((s) => s.setVideoInitializationFailed);

  // Local refs
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ===========================================================================
  // Toggle Audio
  // ===========================================================================

  const toggleAudio = useCallback(async () => {
    if (localAudioTrack) {
      const newEnabled = !localAudioTrack.enabled;
      localAudioTrack.enabled = newEnabled;
      setAudioEnabledStore(newEnabled);
      return;
    }

    if (isAudioEnabled) return;

    try {
      const result = await mediaCaptureService.capture({
        audio: true,
        video: false,
        audioDeviceId: selectedAudioInput ?? undefined,
      });

      if (!mountedRef.current) {
        mediaCaptureService.stopStream(result.stream);
        return;
      }

      if (result.audioTrack) {
        if (localStream && localVideoTrack) {
          const newStream = new MediaStream([result.audioTrack, localVideoTrack]);
          setLocalStream(newStream);
        } else if (localStream) {
          const newStream = new MediaStream([result.audioTrack, ...localStream.getVideoTracks()]);
          setLocalStream(newStream);
        } else {
          setLocalStream(result.stream);
        }
        setLocalAudioTrack(result.audioTrack);
        setAudioEnabledStore(true);
      }
    } catch (error) {
      logger.error('Failed to capture audio', { error: String(error) });
    }
  }, [
    localAudioTrack,
    localVideoTrack,
    localStream,
    isAudioEnabled,
    selectedAudioInput,
    setLocalStream,
    setLocalAudioTrack,
    setAudioEnabledStore,
  ]);

  // ===========================================================================
  // Toggle Video
  // ===========================================================================

  const toggleVideo = useCallback(async () => {
    if (localVideoTrack) {
      const newEnabled = !localVideoTrack.enabled;
      localVideoTrack.enabled = newEnabled;
      setVideoEnabledStore(newEnabled);
      return;
    }

    try {
      const result = await mediaCaptureService.capture({
        audio: false,
        video: true,
        videoDeviceId: selectedVideoInput ?? undefined,
      });

      if (!mountedRef.current) {
        mediaCaptureService.stopStream(result.stream);
        return;
      }

      if (result.videoTrack) {
        const audioTracks = localStream ? localStream.getAudioTracks() : [];
        const newStream = new MediaStream([...audioTracks, result.videoTrack]);
        setLocalStream(newStream);
        setLocalVideoTrack(result.videoTrack);
        setVideoEnabledStore(true);
        setVideoInitializationFailed(false, null);
        if (!hasVideoPermission) {
          setPermissions(hasAudioPermission, true);
          setPermissionError(null);
        }
      }
    } catch (error) {
      const mediaError = error as MediaError;
      setVideoInitializationFailed(true, mediaError.message);
    }
  }, [
    localVideoTrack,
    localStream,
    selectedVideoInput,
    hasVideoPermission,
    hasAudioPermission,
    setLocalStream,
    setLocalVideoTrack,
    setVideoEnabledStore,
    setPermissions,
    setPermissionError,
    setVideoInitializationFailed,
  ]);

  // ===========================================================================
  // Set Audio Enabled
  // ===========================================================================

  const setAudioEnabled = useCallback(
    async (enabled: boolean) => {
      if (localAudioTrack) {
        localAudioTrack.enabled = enabled;
        setAudioEnabledStore(enabled);
        return;
      }

      if (!enabled) return;

      try {
        const result = await mediaCaptureService.capture({
          audio: true,
          video: false,
          audioDeviceId: selectedAudioInput ?? undefined,
        });

        if (!mountedRef.current) {
          mediaCaptureService.stopStream(result.stream);
          return;
        }

        if (result.audioTrack) {
          if (localStream && localVideoTrack) {
            const newStream = new MediaStream([result.audioTrack, localVideoTrack]);
            setLocalStream(newStream);
          } else if (localStream) {
            const newStream = new MediaStream([result.audioTrack, ...localStream.getVideoTracks()]);
            setLocalStream(newStream);
          } else {
            setLocalStream(result.stream);
          }
          setLocalAudioTrack(result.audioTrack);
          setAudioEnabledStore(true);
        }
      } catch (error) {
        logger.error('Failed to capture audio', { error: String(error) });
      }
    },
    [
      localAudioTrack,
      localVideoTrack,
      localStream,
      selectedAudioInput,
      setLocalStream,
      setLocalAudioTrack,
      setAudioEnabledStore,
    ]
  );

  // ===========================================================================
  // Set Video Enabled
  // ===========================================================================

  const setVideoEnabled = useCallback(
    async (enabled: boolean) => {
      if (localVideoTrack) {
        localVideoTrack.enabled = enabled;
        setVideoEnabledStore(enabled);
        return;
      }

      if (!enabled) return;

      try {
        const result = await mediaCaptureService.capture({
          audio: false,
          video: true,
          videoDeviceId: selectedVideoInput ?? undefined,
        });

        if (!mountedRef.current) {
          mediaCaptureService.stopStream(result.stream);
          return;
        }

        if (result.videoTrack) {
          if (localStream && localAudioTrack) {
            const newStream = new MediaStream([localAudioTrack, result.videoTrack]);
            setLocalStream(newStream);
          } else if (localStream) {
            const newStream = new MediaStream([...localStream.getAudioTracks(), result.videoTrack]);
            setLocalStream(newStream);
          } else {
            setLocalStream(result.stream);
          }
          setLocalVideoTrack(result.videoTrack);
          setVideoEnabledStore(true);
        }
      } catch (error) {
        logger.error('Failed to capture video', { error: String(error) });
      }
    },
    [
      localVideoTrack,
      localAudioTrack,
      localStream,
      selectedVideoInput,
      setLocalStream,
      setLocalVideoTrack,
      setVideoEnabledStore,
    ]
  );

  return {
    toggleAudio,
    toggleVideo,
    setAudioEnabled,
    setVideoEnabled,
  };
}
