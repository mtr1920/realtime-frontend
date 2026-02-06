/**
 * useMediaDevices Hook
 *
 * Manages media device enumeration, selection, and persistence.
 * Features:
 * - Device enumeration with permission handling
 * - Hot-plugging via devicechange events
 * - localStorage persistence for device preferences
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMediaStore } from '@/shared/stores/media.store';
import type { MediaDevice } from '@/types';
import {
  DEVICE_PREFERENCES_KEY,
  type DevicePreferences,
} from '../types/media.types';

// =============================================================================
// Types
// =============================================================================

interface UseMediaDevicesReturn {
  // Device lists
  audioInputDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  videoInputDevices: MediaDevice[];

  // Selected devices
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  selectedVideoInput: string | null;

  // Permission state
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
  permissionError: string | null;

  // Actions
  selectAudioInput: (deviceId: string) => void;
  selectAudioOutput: (deviceId: string) => void;
  selectVideoInput: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
  requestPermissions: (audio?: boolean, video?: boolean) => Promise<boolean>;
}

// =============================================================================
// Helpers
// =============================================================================

function loadDevicePreferences(): DevicePreferences {
  try {
    const stored = localStorage.getItem(DEVICE_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored) as DevicePreferences;
    }
  } catch {
    // Ignore parse errors
  }
  return { audioInputId: null, audioOutputId: null, videoInputId: null };
}

function saveDevicePreferences(prefs: DevicePreferences): void {
  try {
    localStorage.setItem(DEVICE_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useMediaDevices(): UseMediaDevicesReturn {
  // Store state
  const audioInputDevices = useMediaStore((s) => s.audioInputDevices);
  const audioOutputDevices = useMediaStore((s) => s.audioOutputDevices);
  const videoInputDevices = useMediaStore((s) => s.videoInputDevices);
  const selectedAudioInput = useMediaStore((s) => s.selectedAudioInput);
  const selectedAudioOutput = useMediaStore((s) => s.selectedAudioOutput);
  const selectedVideoInput = useMediaStore((s) => s.selectedVideoInput);
  const hasAudioPermission = useMediaStore((s) => s.hasAudioPermission);
  const hasVideoPermission = useMediaStore((s) => s.hasVideoPermission);
  const permissionError = useMediaStore((s) => s.permissionError);

  // Store actions
  const setDevices = useMediaStore((s) => s.setDevices);
  const setSelectedAudioInput = useMediaStore((s) => s.setSelectedAudioInput);
  const setSelectedAudioOutput = useMediaStore((s) => s.setSelectedAudioOutput);
  const setSelectedVideoInput = useMediaStore((s) => s.setSelectedVideoInput);
  const setPermissions = useMediaStore((s) => s.setPermissions);
  const setPermissionError = useMediaStore((s) => s.setPermissionError);

  // Track if initial load has happened
  const initializedRef = useRef(false);

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
      return devices;
    } catch {
      // Error is surfaced via permissionError state when relevant
      return [];
    }
  }, [setDevices]);

  // Apply saved preferences after enumeration
  const applySavedPreferences = useCallback(
    (devices: MediaDeviceInfo[]) => {
      const prefs = loadDevicePreferences();

      // Check if saved device still exists
      const audioInputExists = devices.some(
        (d) => d.deviceId === prefs.audioInputId && d.kind === 'audioinput'
      );
      const audioOutputExists = devices.some(
        (d) => d.deviceId === prefs.audioOutputId && d.kind === 'audiooutput'
      );
      const videoInputExists = devices.some(
        (d) => d.deviceId === prefs.videoInputId && d.kind === 'videoinput'
      );

      if (audioInputExists && prefs.audioInputId) {
        setSelectedAudioInput(prefs.audioInputId);
      }
      if (audioOutputExists && prefs.audioOutputId) {
        setSelectedAudioOutput(prefs.audioOutputId);
      }
      if (videoInputExists && prefs.videoInputId) {
        setSelectedVideoInput(prefs.videoInputId);
      }
    },
    [setSelectedAudioInput, setSelectedAudioOutput, setSelectedVideoInput]
  );

  // Request permissions and enumerate
  const requestPermissions = useCallback(
    async (audio = true, video = true): Promise<boolean> => {
      setPermissionError(null);

      try {
        // Request media to get permissions
        const constraints: MediaStreamConstraints = {};
        if (audio) constraints.audio = true;
        if (video) constraints.video = true;

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Stop tracks immediately - we just needed permission
        stream.getTracks().forEach((track) => track.stop());

        // Update permission state
        setPermissions(audio, video);

        // Now enumerate devices (labels will be available)
        const devices = await enumerateDevices();
        applySavedPreferences(devices);

        return true;
      } catch (error) {
        const err = error as DOMException;
        let message = 'Failed to access media devices';

        if (err.name === 'NotAllowedError') {
          message = 'Permission denied. Please allow camera and microphone access.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera or microphone found.';
        } else if (err.name === 'NotReadableError') {
          message = 'Device is in use by another application.';
        } else if (err.name === 'OverconstrainedError') {
          message = 'Device constraints cannot be satisfied.';
        }

        setPermissionError(message);
        setPermissions(false, false);
        return false;
      }
    },
    [enumerateDevices, applySavedPreferences, setPermissions, setPermissionError]
  );

  // Refresh devices (for manual refresh)
  const refreshDevices = useCallback(async () => {
    await enumerateDevices();
  }, [enumerateDevices]);

  // Device selection with persistence
  const selectAudioInput = useCallback(
    (deviceId: string) => {
      setSelectedAudioInput(deviceId);
      const prefs = loadDevicePreferences();
      saveDevicePreferences({ ...prefs, audioInputId: deviceId });
    },
    [setSelectedAudioInput]
  );

  const selectAudioOutput = useCallback(
    (deviceId: string) => {
      setSelectedAudioOutput(deviceId);
      const prefs = loadDevicePreferences();
      saveDevicePreferences({ ...prefs, audioOutputId: deviceId });
    },
    [setSelectedAudioOutput]
  );

  const selectVideoInput = useCallback(
    (deviceId: string) => {
      setSelectedVideoInput(deviceId);
      const prefs = loadDevicePreferences();
      saveDevicePreferences({ ...prefs, videoInputId: deviceId });
    },
    [setSelectedVideoInput]
  );

  // Initial enumeration and devicechange listener
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Initial enumeration (may have limited labels without permission)
    enumerateDevices().then((devices) => {
      // Check if we already have labels (permission granted previously)
      const hasLabels = devices.some((d) => d.label && d.label.length > 0);
      if (hasLabels) {
        setPermissions(true, true);
        applySavedPreferences(devices);
      }
    });
  }, [enumerateDevices, applySavedPreferences, setPermissions]);

  // Device change listener (hot-plugging)
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices]);

  return {
    // Device lists
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,

    // Selected devices
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,

    // Permission state
    hasAudioPermission,
    hasVideoPermission,
    permissionError,

    // Actions
    selectAudioInput,
    selectAudioOutput,
    selectVideoInput,
    refreshDevices,
    requestPermissions,
  };
}
