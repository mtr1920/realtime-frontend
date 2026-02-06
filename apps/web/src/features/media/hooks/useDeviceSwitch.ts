/**
 * useDeviceSwitch Hook
 *
 * Handles audio/video device switching with recovery logic.
 * Extracted from useLocalMedia for single responsibility.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { mediaCaptureService } from '../services/media-capture.service';
import type { MediaError } from '../types/media.types';

// =============================================================================
// Types
// =============================================================================

export interface UseDeviceSwitchReturn {
  /** Switch to a different audio input device */
  switchAudioDevice: (deviceId: string) => Promise<void>;
  /** Switch to a different video input device */
  switchVideoDevice: (deviceId: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useDeviceSwitch(): UseDeviceSwitchReturn {
  // Store selectors
  const localStream = useMediaStore((s) => s.localStream);
  const localAudioTrack = useMediaStore((s) => s.localAudioTrack);
  const localVideoTrack = useMediaStore((s) => s.localVideoTrack);
  const isAudioEnabled = useMediaStore((s) => s.isAudioEnabled);
  const isVideoEnabled = useMediaStore((s) => s.isVideoEnabled);
  const hasAudioPermission = useMediaStore((s) => s.hasAudioPermission);
  const hasVideoPermission = useMediaStore((s) => s.hasVideoPermission);
  const permissionError = useMediaStore((s) => s.permissionError);
  const selectedAudioInput = useMediaStore((s) => s.selectedAudioInput);
  const selectedVideoInput = useMediaStore((s) => s.selectedVideoInput);
  const audioInitializationFailed = useMediaStore((s) => s.audioInitializationFailed);
  const videoInitializationFailed = useMediaStore((s) => s.videoInitializationFailed);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const setLocalAudioTrack = useMediaStore((s) => s.setLocalAudioTrack);
  const setLocalVideoTrack = useMediaStore((s) => s.setLocalVideoTrack);
  const setAudioEnabledStore = useMediaStore((s) => s.setAudioEnabled);
  const setVideoEnabledStore = useMediaStore((s) => s.setVideoEnabled);
  const setPermissions = useMediaStore((s) => s.setPermissions);
  const setPermissionError = useMediaStore((s) => s.setPermissionError);
  const setAudioInitializationFailed = useMediaStore((s) => s.setAudioInitializationFailed);
  const setVideoInitializationFailed = useMediaStore((s) => s.setVideoInitializationFailed);

  // Local refs
  const mountedRef = useRef(true);
  const errorRef = useRef<MediaError | null>(null);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ===========================================================================
  // Switch Audio Device
  // ===========================================================================

  const switchAudioDevice = useCallback(
    async (deviceId: string) => {
      // Case 1: Active stream - replace track
      if (localStream) {
        try {
          const newTrack = await mediaCaptureService.replaceTrack(localStream, 'audio', deviceId);
          newTrack.enabled = isAudioEnabled;
          setLocalAudioTrack(newTrack);
          setAudioInitializationFailed(false, null);
        } catch (error) {
          errorRef.current = error as MediaError;
          throw error;
        }
        return;
      }

      // Case 2: Previous initialization failure - try to recover
      if (audioInitializationFailed) {
        try {
          errorRef.current = null;

          const result = await mediaCaptureService.capture({
            audio: true,
            video: localVideoTrack !== null,
            audioDeviceId: deviceId,
            videoDeviceId: selectedVideoInput ?? undefined,
          });

          if (!mountedRef.current) {
            mediaCaptureService.stopStream(result.stream);
            return;
          }

          setAudioInitializationFailed(false, null);

          if (localVideoTrack && result.audioTrack) {
            const combinedStream = new MediaStream([result.audioTrack, localVideoTrack]);
            result.videoTrack?.stop();
            setLocalStream(combinedStream);
          } else {
            setLocalStream(result.stream);
            if (result.videoTrack) {
              setLocalVideoTrack(result.videoTrack);
              setVideoEnabledStore(true);
            }
          }

          if (result.audioTrack) {
            result.audioTrack.enabled = true;
            setLocalAudioTrack(result.audioTrack);
            setAudioEnabledStore(true);
          }
        } catch (error) {
          const mediaError = error as MediaError;
          errorRef.current = mediaError;
          setAudioInitializationFailed(true, mediaError.message);
          throw error;
        }
        return;
      }

      // Case 3: No stream and no previous failure - nothing to do
    },
    [
      localStream,
      localVideoTrack,
      isAudioEnabled,
      audioInitializationFailed,
      selectedVideoInput,
      setLocalStream,
      setLocalAudioTrack,
      setLocalVideoTrack,
      setAudioEnabledStore,
      setVideoEnabledStore,
      setAudioInitializationFailed,
    ]
  );

  // ===========================================================================
  // Switch Video Device
  // ===========================================================================

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      // Case 1: Active stream - replace track
      if (localStream) {
        try {
          const newTrack = await mediaCaptureService.replaceTrack(localStream, 'video', deviceId);
          newTrack.enabled = isVideoEnabled;
          setLocalVideoTrack(newTrack);
          setLocalStream(
            new MediaStream([...localStream.getAudioTracks(), ...localStream.getVideoTracks()])
          );
          setVideoInitializationFailed(false, null);
          if (!hasVideoPermission || permissionError) {
            setPermissions(hasAudioPermission, true);
            setPermissionError(null);
          }
        } catch (error) {
          errorRef.current = error as MediaError;
          throw error;
        }
        return;
      }

      // Case 2: Should reinitialize (failure, permission error, or needs recovery)
      const shouldReinitialize =
        videoInitializationFailed || Boolean(permissionError) || (!hasVideoPermission && isVideoEnabled);

      if (!shouldReinitialize) {
        return;
      }

      if (permissionError) {
        setPermissionError(null);
      }

      try {
        errorRef.current = null;

        const result = await mediaCaptureService.capture({
          audio: localAudioTrack !== null,
          video: true,
          audioDeviceId: selectedAudioInput ?? undefined,
          videoDeviceId: deviceId,
        });

        if (!mountedRef.current) {
          mediaCaptureService.stopStream(result.stream);
          return;
        }

        setVideoInitializationFailed(false, null);

        if (localAudioTrack && result.videoTrack) {
          const combinedStream = new MediaStream([localAudioTrack, result.videoTrack]);
          result.audioTrack?.stop();
          setLocalStream(combinedStream);
        } else {
          setLocalStream(result.stream);
          if (result.audioTrack) {
            setLocalAudioTrack(result.audioTrack);
            setAudioEnabledStore(true);
          }
        }

        if (result.videoTrack) {
          result.videoTrack.enabled = true;
          setLocalVideoTrack(result.videoTrack);
          setVideoEnabledStore(true);
          if (!hasVideoPermission || permissionError) {
            setPermissions(hasAudioPermission, true);
            setPermissionError(null);
          }
        }
      } catch (error) {
        const mediaError = error as MediaError;
        errorRef.current = mediaError;
        if (mediaError.type === 'permission_denied') {
          setPermissions(hasAudioPermission, false);
          setPermissionError(mediaError.message);
        }
        setVideoInitializationFailed(true, mediaError.message);
        throw error;
      }
    },
    [
      localStream,
      localAudioTrack,
      isVideoEnabled,
      videoInitializationFailed,
      permissionError,
      hasVideoPermission,
      selectedAudioInput,
      setLocalStream,
      setLocalVideoTrack,
      setLocalAudioTrack,
      setVideoEnabledStore,
      setAudioEnabledStore,
      setVideoInitializationFailed,
      hasAudioPermission,
      setPermissions,
      setPermissionError,
    ]
  );

  return {
    switchAudioDevice,
    switchVideoDevice,
  };
}
