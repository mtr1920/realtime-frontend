/**
 * useMediaDevices Hook Tests
 * Tests for media device enumeration and selection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaDevices } from '@/features/media/hooks/useMediaDevices';
import { useMediaStore } from '@/shared/stores/media.store';
import { DEVICE_PREFERENCES_KEY } from '@/features/media/types/media.types';

// =============================================================================
// Mock Helpers
// =============================================================================

function createMockMediaDeviceInfo(
  kind: MediaDeviceKind,
  deviceId: string,
  label: string
): MediaDeviceInfo {
  return {
    deviceId,
    groupId: `group-${deviceId}`,
    kind,
    label,
    toJSON: () => ({ deviceId, groupId: `group-${deviceId}`, kind, label }),
  };
}

function createMockMediaStream(trackCount = 1): MediaStream {
  const tracks: MediaStreamTrack[] = [];
  for (let i = 0; i < trackCount; i++) {
    tracks.push({
      id: `track-${i}`,
      kind: 'audio',
      enabled: true,
      muted: false,
      label: `Track ${i}`,
      readyState: 'live',
      stop: vi.fn(),
      clone: vi.fn(),
      getCapabilities: vi.fn().mockReturnValue({}),
      getConstraints: vi.fn().mockReturnValue({}),
      getSettings: vi.fn().mockReturnValue({}),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true),
      onended: null,
      onmute: null,
      onunmute: null,
      contentHint: '',
    } as unknown as MediaStreamTrack);
  }

  return {
    id: `stream-${Date.now()}`,
    active: true,
    getTracks: vi.fn().mockReturnValue(tracks),
    getAudioTracks: vi.fn().mockReturnValue(tracks.filter((t) => t.kind === 'audio')),
    getVideoTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    getTrackById: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
    onaddtrack: null,
    onremovetrack: null,
  } as unknown as MediaStream;
}

// =============================================================================
// Mock Setup
// =============================================================================

const mockEnumerateDevices = vi.fn();
const mockGetUserMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  // Reset media store
  act(() => {
    useMediaStore.getState().reset();
  });

  // Clear localStorage
  localStorage.clear();

  // Reset mocks
  vi.clearAllMocks();

  // Setup navigator.mediaDevices mock
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      enumerateDevices: mockEnumerateDevices,
      getUserMedia: mockGetUserMedia,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    },
    writable: true,
    configurable: true,
  });

  // Default mock implementations
  mockEnumerateDevices.mockResolvedValue([]);
  mockGetUserMedia.mockResolvedValue(createMockMediaStream());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe('useMediaDevices', () => {
  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should return empty device lists initially', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.audioInputDevices).toEqual([]);
        expect(result.current.audioOutputDevices).toEqual([]);
        expect(result.current.videoInputDevices).toEqual([]);
      });
    });

    it('should return null for selected devices initially', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.selectedAudioInput).toBeNull();
        expect(result.current.selectedAudioOutput).toBeNull();
        expect(result.current.selectedVideoInput).toBeNull();
      });
    });

    it('should return false for permissions initially', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.hasAudioPermission).toBe(false);
        expect(result.current.hasVideoPermission).toBe(false);
      });
    });

    it('should return null for permission error initially', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.permissionError).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Device Enumeration
  // ===========================================================================

  describe('device enumeration', () => {
    it('should enumerate devices on mount', async () => {
      const devices = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('audiooutput', 'speaker-1', 'Speaker 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-1', 'Camera 1'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.audioInputDevices).toHaveLength(1);
        expect(result.current.audioOutputDevices).toHaveLength(1);
        expect(result.current.videoInputDevices).toHaveLength(1);
      });
    });

    it('should call enumerateDevices', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });
    });

    it('should add devicechange event listener', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalledWith(
          'devicechange',
          expect.any(Function)
        );
      });
    });

    it('should remove devicechange event listener on unmount', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const { unmount } = renderHook(() => useMediaDevices());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });
  });

  // ===========================================================================
  // Device Selection
  // ===========================================================================

  describe('device selection', () => {
    it('should select audio input and persist to localStorage', async () => {
      const devices = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('audioinput', 'mic-2', 'Microphone 2'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.audioInputDevices).toHaveLength(2);
      });

      act(() => {
        result.current.selectAudioInput('mic-2');
      });

      expect(result.current.selectedAudioInput).toBe('mic-2');

      // Check localStorage
      const stored = JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_KEY) || '{}');
      expect(stored.audioInputId).toBe('mic-2');
    });

    it('should select audio output and persist to localStorage', async () => {
      const devices = [
        createMockMediaDeviceInfo('audiooutput', 'speaker-1', 'Speaker 1'),
        createMockMediaDeviceInfo('audiooutput', 'speaker-2', 'Speaker 2'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.audioOutputDevices).toHaveLength(2);
      });

      act(() => {
        result.current.selectAudioOutput('speaker-2');
      });

      expect(result.current.selectedAudioOutput).toBe('speaker-2');

      const stored = JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_KEY) || '{}');
      expect(stored.audioOutputId).toBe('speaker-2');
    });

    it('should select video input and persist to localStorage', async () => {
      const devices = [
        createMockMediaDeviceInfo('videoinput', 'camera-1', 'Camera 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-2', 'Camera 2'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.videoInputDevices).toHaveLength(2);
      });

      act(() => {
        result.current.selectVideoInput('camera-2');
      });

      expect(result.current.selectedVideoInput).toBe('camera-2');

      const stored = JSON.parse(localStorage.getItem(DEVICE_PREFERENCES_KEY) || '{}');
      expect(stored.videoInputId).toBe('camera-2');
    });
  });

  // ===========================================================================
  // Permissions
  // ===========================================================================

  describe('requestPermissions', () => {
    it('should request permissions and return true on success', async () => {
      const devices = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-1', 'Camera 1'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const stream = createMockMediaStream();
      mockGetUserMedia.mockResolvedValue(stream);

      const { result } = renderHook(() => useMediaDevices());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.requestPermissions(true, true);
      });

      expect(success).toBe(true);
      expect(result.current.hasAudioPermission).toBe(true);
      expect(result.current.hasVideoPermission).toBe(true);
      expect(result.current.permissionError).toBeNull();
    });

    it('should stop tracks after getting permission', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const stream = createMockMediaStream(2);
      mockGetUserMedia.mockResolvedValue(stream);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.requestPermissions(true, true);
      });

      const tracks = stream.getTracks();
      for (const track of tracks) {
        expect(track.stop).toHaveBeenCalled();
      }
    });

    it('should handle NotAllowedError', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const error = new DOMException('Permission denied', 'NotAllowedError');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaDevices());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.requestPermissions(true, true);
      });

      expect(success).toBe(false);
      expect(result.current.permissionError).toBe(
        'Permission denied. Please allow camera and microphone access.'
      );
      expect(result.current.hasAudioPermission).toBe(false);
      expect(result.current.hasVideoPermission).toBe(false);
    });

    it('should handle NotFoundError', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const error = new DOMException('No devices', 'NotFoundError');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(result.current.permissionError).toBe('No camera or microphone found.');
    });

    it('should handle NotReadableError', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const error = new DOMException('Device in use', 'NotReadableError');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(result.current.permissionError).toBe('Device is in use by another application.');
    });

    it('should handle OverconstrainedError', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const error = new DOMException('Constraints not satisfied', 'OverconstrainedError');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(result.current.permissionError).toBe('Device constraints cannot be satisfied.');
    });

    it('should handle generic errors', async () => {
      mockEnumerateDevices.mockResolvedValue([]);

      const error = new DOMException('Unknown error', 'UnknownError');
      mockGetUserMedia.mockRejectedValue(error);

      const { result } = renderHook(() => useMediaDevices());

      await act(async () => {
        await result.current.requestPermissions();
      });

      expect(result.current.permissionError).toBe('Failed to access media devices');
    });
  });

  // ===========================================================================
  // Refresh Devices
  // ===========================================================================

  describe('refreshDevices', () => {
    it('should re-enumerate devices', async () => {
      mockEnumerateDevices
        .mockResolvedValueOnce([]) // Initial
        .mockResolvedValueOnce([ // After refresh
          createMockMediaDeviceInfo('audioinput', 'mic-new', 'New Microphone'),
        ]);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.refreshDevices();
      });

      expect(mockEnumerateDevices).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Saved Preferences
  // ===========================================================================

  describe('saved preferences', () => {
    it('should load saved preferences when devices have labels', async () => {
      // Set saved preferences
      localStorage.setItem(
        DEVICE_PREFERENCES_KEY,
        JSON.stringify({
          audioInputId: 'saved-mic',
          audioOutputId: 'saved-speaker',
          videoInputId: 'saved-camera',
        })
      );

      // Return devices with labels (indicating permission was granted)
      const devices = [
        createMockMediaDeviceInfo('audioinput', 'saved-mic', 'Saved Microphone'),
        createMockMediaDeviceInfo('audiooutput', 'saved-speaker', 'Saved Speaker'),
        createMockMediaDeviceInfo('videoinput', 'saved-camera', 'Saved Camera'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        expect(result.current.selectedAudioInput).toBe('saved-mic');
        expect(result.current.selectedAudioOutput).toBe('saved-speaker');
        expect(result.current.selectedVideoInput).toBe('saved-camera');
      });
    });

    it('should not apply preferences if saved device no longer exists', async () => {
      localStorage.setItem(
        DEVICE_PREFERENCES_KEY,
        JSON.stringify({
          audioInputId: 'removed-mic',
          audioOutputId: 'removed-speaker',
          videoInputId: 'removed-camera',
        })
      );

      const devices = [
        createMockMediaDeviceInfo('audioinput', 'different-mic', 'Different Mic'),
        createMockMediaDeviceInfo('audiooutput', 'different-speaker', 'Different Speaker'),
        createMockMediaDeviceInfo('videoinput', 'different-camera', 'Different Camera'),
      ];
      mockEnumerateDevices.mockResolvedValue(devices);

      const { result } = renderHook(() => useMediaDevices());

      await waitFor(() => {
        // Should auto-select first device, not the saved one that doesn't exist
        expect(result.current.audioInputDevices).toHaveLength(1);
      });

      // The saved device IDs shouldn't be selected since they don't exist
      // Instead, auto-selection should kick in
      expect(result.current.selectedAudioInput).toBe('different-mic');
    });
  });
});
