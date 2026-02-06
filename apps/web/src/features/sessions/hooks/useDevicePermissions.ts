/**
 * useDevicePermissions Hook
 *
 * Handles media device permission requests and enumeration.
 */

import { useState, useCallback, useEffect } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';

export interface DevicePermissionsState {
  /** Whether audio permission is granted */
  hasAudioPermission: boolean;

  /** Whether video permission is granted */
  hasVideoPermission: boolean;

  /** Whether we're currently requesting permissions */
  isRequesting: boolean;

  /** Error message if permission request failed */
  error: string | null;

  /** Whether permissions have been checked */
  isChecked: boolean;
}

export interface DevicePermissionsResult extends DevicePermissionsState {
  /** Request audio permission */
  requestAudioPermission: () => Promise<boolean>;

  /** Request video permission */
  requestVideoPermission: () => Promise<boolean>;

  /** Request both audio and video permissions */
  requestAllPermissions: () => Promise<{ audio: boolean; video: boolean }>;

  /** Refresh device list */
  refreshDevices: () => Promise<void>;

  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for managing media device permissions
 *
 * @example
 * ```tsx
 * const { hasAudioPermission, hasVideoPermission, requestAllPermissions } = useDevicePermissions();
 *
 * useEffect(() => {
 *   requestAllPermissions();
 * }, []);
 * ```
 */
export function useDevicePermissions(): DevicePermissionsResult {
  const [state, setState] = useState<DevicePermissionsState>({
    hasAudioPermission: false,
    hasVideoPermission: false,
    isRequesting: false,
    error: null,
    isChecked: false,
  });

  const { setDevices, setPermissions, setPermissionError } = useMediaStore();

  // Enumerate devices - memoized
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  }, [setDevices]);

  // Check initial permission state - memoized
  const checkPermissions = useCallback(async () => {
    try {
      // Try to get permission status using the Permissions API
      if ('permissions' in navigator) {
        const [micStatus, cameraStatus] = await Promise.all([
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
          navigator.permissions.query({ name: 'camera' as PermissionName }),
        ]);

        const hasAudio = micStatus.state === 'granted';
        const hasVideo = cameraStatus.state === 'granted';

        setState((prev) => ({
          ...prev,
          hasAudioPermission: hasAudio,
          hasVideoPermission: hasVideo,
          isChecked: true,
        }));

        setPermissions(hasAudio, hasVideo);

        // If we have permissions, enumerate devices
        if (hasAudio || hasVideo) {
          await enumerateDevices();
        }
      }
    } catch {
      // Permissions API not supported, will check when requesting
      setState((prev) => ({ ...prev, isChecked: true }));
    }
  }, [enumerateDevices, setPermissions]);

  // Check initial permission state
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestAudioPermission = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isRequesting: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        hasAudioPermission: true,
        isRequesting: false,
      }));

      setPermissions(true, state.hasVideoPermission);
      await enumerateDevices();

      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isRequesting: false,
        error: message,
      }));
      setPermissionError(message);
      return false;
    }
  }, [state.hasVideoPermission, setPermissions, setPermissionError, enumerateDevices]);

  const requestVideoPermission = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isRequesting: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop all tracks immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        hasVideoPermission: true,
        isRequesting: false,
      }));

      setPermissions(state.hasAudioPermission, true);
      await enumerateDevices();

      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isRequesting: false,
        error: message,
      }));
      setPermissionError(message);
      return false;
    }
  }, [state.hasAudioPermission, setPermissions, setPermissionError, enumerateDevices]);

  const requestAllPermissions = useCallback(async (): Promise<{
    audio: boolean;
    video: boolean;
  }> => {
    setState((prev) => ({ ...prev, isRequesting: true, error: null }));

    let audioGranted = false;
    let videoGranted = false;

    try {
      // Request both permissions together
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Check which tracks we got
      audioGranted = stream.getAudioTracks().length > 0;
      videoGranted = stream.getVideoTracks().length > 0;

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      // If combined request fails, try individually
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getTracks().forEach((track) => track.stop());
        audioGranted = true;
      } catch {
        // Audio permission denied
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStream.getTracks().forEach((track) => track.stop());
        videoGranted = true;
      } catch {
        // Video permission denied
      }

      if (!audioGranted && !videoGranted) {
        const message = getErrorMessage(error);
        setState((prev) => ({
          ...prev,
          isRequesting: false,
          error: message,
        }));
        setPermissionError(message);
      }
    }

    setState((prev) => ({
      ...prev,
      hasAudioPermission: audioGranted,
      hasVideoPermission: videoGranted,
      isRequesting: false,
      isChecked: true,
    }));

    setPermissions(audioGranted, videoGranted);

    if (audioGranted || videoGranted) {
      await enumerateDevices();
    }

    return { audio: audioGranted, video: videoGranted };
  }, [setPermissions, setPermissionError, enumerateDevices]);

  const refreshDevices = useCallback(async () => {
    await enumerateDevices();
  }, [enumerateDevices]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    setPermissionError(null);
  }, [setPermissionError]);

  return {
    ...state,
    requestAudioPermission,
    requestVideoPermission,
    requestAllPermissions,
    refreshDevices,
    clearError,
  };
}

/**
 * Get a user-friendly error message from a permission error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError') {
      return 'Permission denied. Please allow access to your camera and microphone.';
    }
    if (error.name === 'NotFoundError') {
      return 'No camera or microphone found. Please connect a device and try again.';
    }
    if (error.name === 'NotReadableError') {
      return 'Could not access your camera or microphone. It may be in use by another application.';
    }
    if (error.name === 'OverconstrainedError') {
      return 'Could not find a camera or microphone that meets the requirements.';
    }
    return error.message;
  }
  return 'An unknown error occurred while requesting permissions.';
}
