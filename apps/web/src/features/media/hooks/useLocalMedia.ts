/**
 * useLocalMedia Hook
 *
 * Unified local media management hook.
 * Composes useMediaCapture, useMediaToggle, and useDeviceSwitch.
 *
 * Use this as the primary API for local media in components.
 */

import { useEffect, useRef } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import { useMediaCapture, type UseMediaCaptureOptions } from './useMediaCapture';
import { useMediaToggle } from './useMediaToggle';
import { useDeviceSwitch } from './useDeviceSwitch';
import type { MediaError } from '../types/media.types';

// =============================================================================
// Types
// =============================================================================

interface UseLocalMediaOptions extends UseMediaCaptureOptions {
  /** Start capture immediately on mount */
  autoStart?: boolean;
}

interface UseLocalMediaReturn {
  // Stream state
  localStream: MediaStream | null;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;

  // Enable state
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;

  // Loading/error state
  isCapturing: boolean;
  error: MediaError | null;

  // Initialization failure state (for recovery via device switch)
  videoInitializationFailed: boolean;
  videoInitializationError: string | null;
  audioInitializationFailed: boolean;
  audioInitializationError: string | null;

  // Capture actions
  startCapture: (options?: { audio?: boolean; video?: boolean }) => Promise<void>;
  stopCapture: () => void;

  // Toggle actions
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  setAudioEnabled: (enabled: boolean) => Promise<void>;
  setVideoEnabled: (enabled: boolean) => Promise<void>;

  // Device switch actions
  switchAudioDevice: (deviceId: string) => Promise<void>;
  switchVideoDevice: (deviceId: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

export function useLocalMedia(options: UseLocalMediaOptions = {}): UseLocalMediaReturn {
  const { autoStart = false, audioEnabled = true, videoEnabled = true } = options;

  // Compose from extracted hooks
  const { startCapture, stopCapture, isCapturing, error } = useMediaCapture({
    audioEnabled,
    videoEnabled,
  });
  const { toggleAudio, toggleVideo, setAudioEnabled, setVideoEnabled } = useMediaToggle();
  const { switchAudioDevice, switchVideoDevice } = useDeviceSwitch();

  // Store selectors for state
  const localStream = useMediaStore((s) => s.localStream);
  const localAudioTrack = useMediaStore((s) => s.localAudioTrack);
  const localVideoTrack = useMediaStore((s) => s.localVideoTrack);
  const isAudioEnabledState = useMediaStore((s) => s.isAudioEnabled);
  const isVideoEnabledState = useMediaStore((s) => s.isVideoEnabled);
  const videoInitializationFailed = useMediaStore((s) => s.videoInitializationFailed);
  const videoInitializationError = useMediaStore((s) => s.videoInitializationError);
  const audioInitializationFailed = useMediaStore((s) => s.audioInitializationFailed);
  const audioInitializationError = useMediaStore((s) => s.audioInitializationError);
  const selectedVideoInput = useMediaStore((s) => s.selectedVideoInput);
  const permissionError = useMediaStore((s) => s.permissionError);

  // Refs for auto-recovery
  const isCapturingRef = useRef(false);
  const lastVideoInputRef = useRef<string | null>(selectedVideoInput);

  // ===========================================================================
  // Auto-Recovery on Camera Switch
  // ===========================================================================

  useEffect(() => {
    if (selectedVideoInput === lastVideoInputRef.current) return;
    lastVideoInputRef.current = selectedVideoInput;
    if (!selectedVideoInput || isCapturingRef.current) return;

    const shouldAttempt =
      Boolean(localStream) ||
      (isVideoEnabledState && (videoInitializationFailed || Boolean(permissionError)));

    if (!shouldAttempt) return;

    switchVideoDevice(selectedVideoInput).catch(() => {
      // Error is handled via initialization failure state
    });
  }, [
    selectedVideoInput,
    localStream,
    isVideoEnabledState,
    videoInitializationFailed,
    permissionError,
    switchVideoDevice,
  ]);

  // ===========================================================================
  // Auto-Start on Mount
  // ===========================================================================

  useEffect(() => {
    if (autoStart && !localStream && !isCapturingRef.current) {
      startCapture().catch(() => {
        // Error is stored in capture hook
      });
    }
  }, [autoStart, localStream, startCapture]);

  return {
    // Stream state
    localStream,
    audioTrack: localAudioTrack,
    videoTrack: localVideoTrack,

    // Enable state
    isAudioEnabled: isAudioEnabledState,
    isVideoEnabled: isVideoEnabledState,

    // Loading/error state
    isCapturing,
    error,

    // Initialization failure state
    videoInitializationFailed,
    videoInitializationError,
    audioInitializationFailed,
    audioInitializationError,

    // Capture actions
    startCapture,
    stopCapture,

    // Toggle actions
    toggleAudio,
    toggleVideo,
    setAudioEnabled,
    setVideoEnabled,

    // Device switch actions
    switchAudioDevice,
    switchVideoDevice,
  };
}
