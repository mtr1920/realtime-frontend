/**
 * Media Store Tests
 * Tests for the media state management store.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useMediaStore } from '@/shared/stores/media.store';

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

function createMockMediaStreamTrack(id: string, kind: 'audio' | 'video'): MediaStreamTrack {
  return {
    id,
    kind,
    enabled: true,
    muted: false,
    label: `${kind}-track-${id}`,
    readyState: 'live',
    contentHint: '',
    stop: vi.fn(),
    clone: vi.fn(),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
    getCapabilities: vi.fn().mockReturnValue({}),
    getConstraints: vi.fn().mockReturnValue({}),
    getSettings: vi.fn().mockReturnValue({}),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
    onended: null,
    onmute: null,
    onunmute: null,
  } as unknown as MediaStreamTrack;
}

function createMockMediaStream(tracks: MediaStreamTrack[]): MediaStream {
  return {
    id: `stream-${Date.now()}`,
    active: true,
    getTracks: vi.fn().mockReturnValue(tracks),
    getAudioTracks: vi.fn().mockReturnValue(tracks.filter((t) => t.kind === 'audio')),
    getVideoTracks: vi.fn().mockReturnValue(tracks.filter((t) => t.kind === 'video')),
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
// Tests
// =============================================================================

describe('useMediaStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useMediaStore.getState().reset();
    });
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useMediaStore.getState();

      expect(state.audioInputDevices).toEqual([]);
      expect(state.audioOutputDevices).toEqual([]);
      expect(state.videoInputDevices).toEqual([]);
      expect(state.selectedAudioInput).toBeNull();
      expect(state.selectedAudioOutput).toBeNull();
      expect(state.selectedVideoInput).toBeNull();
      expect(state.hasAudioPermission).toBe(false);
      expect(state.hasVideoPermission).toBe(false);
      expect(state.permissionError).toBeNull();
      expect(state.localStream).toBeNull();
      expect(state.localAudioTrack).toBeNull();
      expect(state.localVideoTrack).toBeNull();
      expect(state.screenShareStream).toBeNull();
      expect(state.isAudioEnabled).toBe(false);
      expect(state.isVideoEnabled).toBe(false);
      expect(state.isScreenShareEnabled).toBe(false);
      expect(state.isSpeaking).toBe(false);
      expect(state.audioLevel).toBe(0);
    });
  });

  // ===========================================================================
  // Device Management
  // ===========================================================================

  describe('setDevices', () => {
    it('should categorize devices by kind', () => {
      const devices: MediaDeviceInfo[] = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('audioinput', 'mic-2', 'Microphone 2'),
        createMockMediaDeviceInfo('audiooutput', 'speaker-1', 'Speaker 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-1', 'Camera 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-2', 'Camera 2'),
      ];

      act(() => {
        useMediaStore.getState().setDevices(devices);
      });

      const state = useMediaStore.getState();
      expect(state.audioInputDevices).toHaveLength(2);
      expect(state.audioOutputDevices).toHaveLength(1);
      expect(state.videoInputDevices).toHaveLength(2);
    });

    it('should auto-select first device if none selected', () => {
      const devices: MediaDeviceInfo[] = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('audiooutput', 'speaker-1', 'Speaker 1'),
        createMockMediaDeviceInfo('videoinput', 'camera-1', 'Camera 1'),
      ];

      act(() => {
        useMediaStore.getState().setDevices(devices);
      });

      const state = useMediaStore.getState();
      expect(state.selectedAudioInput).toBe('mic-1');
      expect(state.selectedAudioOutput).toBe('speaker-1');
      expect(state.selectedVideoInput).toBe('camera-1');
    });

    it('should not change selection if already selected', () => {
      act(() => {
        useMediaStore.getState().setSelectedAudioInput('existing-mic');
      });

      const devices: MediaDeviceInfo[] = [
        createMockMediaDeviceInfo('audioinput', 'mic-1', 'Microphone 1'),
        createMockMediaDeviceInfo('audioinput', 'mic-2', 'Microphone 2'),
      ];

      act(() => {
        useMediaStore.getState().setDevices(devices);
      });

      expect(useMediaStore.getState().selectedAudioInput).toBe('existing-mic');
    });

    it('should generate fallback labels for unlabeled devices', () => {
      const devices: MediaDeviceInfo[] = [
        createMockMediaDeviceInfo('audioinput', 'abcde12345', ''),
        createMockMediaDeviceInfo('audiooutput', 'fghij67890', ''),
        createMockMediaDeviceInfo('videoinput', 'klmno11111', ''),
      ];

      act(() => {
        useMediaStore.getState().setDevices(devices);
      });

      const state = useMediaStore.getState();
      expect(state.audioInputDevices[0]?.label).toBe('Microphone abcde');
      expect(state.audioOutputDevices[0]?.label).toBe('Speaker fghij');
      expect(state.videoInputDevices[0]?.label).toBe('Camera klmno');
    });
  });

  describe('device selection', () => {
    it('should set selected audio input', () => {
      act(() => {
        useMediaStore.getState().setSelectedAudioInput('mic-123');
      });

      expect(useMediaStore.getState().selectedAudioInput).toBe('mic-123');
    });

    it('should set selected audio output', () => {
      act(() => {
        useMediaStore.getState().setSelectedAudioOutput('speaker-456');
      });

      expect(useMediaStore.getState().selectedAudioOutput).toBe('speaker-456');
    });

    it('should set selected video input', () => {
      act(() => {
        useMediaStore.getState().setSelectedVideoInput('camera-789');
      });

      expect(useMediaStore.getState().selectedVideoInput).toBe('camera-789');
    });
  });

  // ===========================================================================
  // Permissions
  // ===========================================================================

  describe('permissions', () => {
    it('should set audio and video permissions', () => {
      act(() => {
        useMediaStore.getState().setPermissions(true, true);
      });

      const state = useMediaStore.getState();
      expect(state.hasAudioPermission).toBe(true);
      expect(state.hasVideoPermission).toBe(true);
    });

    it('should set only audio permission', () => {
      act(() => {
        useMediaStore.getState().setPermissions(true, false);
      });

      const state = useMediaStore.getState();
      expect(state.hasAudioPermission).toBe(true);
      expect(state.hasVideoPermission).toBe(false);
    });

    it('should set permission error', () => {
      act(() => {
        useMediaStore.getState().setPermissionError('Permission denied');
      });

      expect(useMediaStore.getState().permissionError).toBe('Permission denied');
    });

    it('should clear permission error', () => {
      act(() => {
        useMediaStore.getState().setPermissionError('Some error');
        useMediaStore.getState().setPermissionError(null);
      });

      expect(useMediaStore.getState().permissionError).toBeNull();
    });
  });

  // ===========================================================================
  // Media State
  // ===========================================================================

  describe('media state', () => {
    it('should set audio enabled', () => {
      act(() => {
        useMediaStore.getState().setAudioEnabled(true);
      });

      expect(useMediaStore.getState().isAudioEnabled).toBe(true);
    });

    it('should set video enabled', () => {
      act(() => {
        useMediaStore.getState().setVideoEnabled(true);
      });

      expect(useMediaStore.getState().isVideoEnabled).toBe(true);
    });

    it('should set screen share enabled', () => {
      act(() => {
        useMediaStore.getState().setScreenShareEnabled(true);
      });

      expect(useMediaStore.getState().isScreenShareEnabled).toBe(true);
    });

    it('should set speaking state', () => {
      act(() => {
        useMediaStore.getState().setSpeaking(true);
      });

      expect(useMediaStore.getState().isSpeaking).toBe(true);
    });

    it('should set audio level', () => {
      act(() => {
        useMediaStore.getState().setAudioLevel(0.75);
      });

      expect(useMediaStore.getState().audioLevel).toBe(0.75);
    });
  });

  // ===========================================================================
  // Stream Management
  // ===========================================================================

  describe('stream management', () => {
    it('should set local stream', () => {
      const audioTrack = createMockMediaStreamTrack('audio-1', 'audio');
      const stream = createMockMediaStream([audioTrack]);

      act(() => {
        useMediaStore.getState().setLocalStream(stream);
      });

      expect(useMediaStore.getState().localStream).toBe(stream);
    });

    it('should set local audio track', () => {
      const track = createMockMediaStreamTrack('audio-1', 'audio');

      act(() => {
        useMediaStore.getState().setLocalAudioTrack(track);
      });

      expect(useMediaStore.getState().localAudioTrack).toBe(track);
    });

    it('should set local video track', () => {
      const track = createMockMediaStreamTrack('video-1', 'video');

      act(() => {
        useMediaStore.getState().setLocalVideoTrack(track);
      });

      expect(useMediaStore.getState().localVideoTrack).toBe(track);
    });

    it('should set screen share stream', () => {
      const videoTrack = createMockMediaStreamTrack('screen-1', 'video');
      const stream = createMockMediaStream([videoTrack]);

      act(() => {
        useMediaStore.getState().setScreenShareStream(stream);
      });

      expect(useMediaStore.getState().screenShareStream).toBe(stream);
    });

    it('should stop all tracks', () => {
      const audioTrack = createMockMediaStreamTrack('audio-1', 'audio');
      const videoTrack = createMockMediaStreamTrack('video-1', 'video');
      const screenTrack = createMockMediaStreamTrack('screen-1', 'video');
      const localStream = createMockMediaStream([audioTrack, videoTrack]);
      const screenStream = createMockMediaStream([screenTrack]);

      act(() => {
        useMediaStore.getState().setLocalStream(localStream);
        useMediaStore.getState().setScreenShareStream(screenStream);
        useMediaStore.getState().setAudioEnabled(true);
        useMediaStore.getState().setVideoEnabled(true);
        useMediaStore.getState().setScreenShareEnabled(true);
      });

      act(() => {
        useMediaStore.getState().stopAllTracks();
      });

      // Verify tracks were stopped
      expect(audioTrack.stop).toHaveBeenCalled();
      expect(videoTrack.stop).toHaveBeenCalled();
      expect(screenTrack.stop).toHaveBeenCalled();

      // Verify state was cleared
      const state = useMediaStore.getState();
      expect(state.localStream).toBeNull();
      expect(state.localAudioTrack).toBeNull();
      expect(state.localVideoTrack).toBeNull();
      expect(state.screenShareStream).toBeNull();
      expect(state.isAudioEnabled).toBe(false);
      expect(state.isVideoEnabled).toBe(false);
      expect(state.isScreenShareEnabled).toBe(false);
    });

    it('should handle stopAllTracks with no streams', () => {
      expect(() => {
        act(() => {
          useMediaStore.getState().stopAllTracks();
        });
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Reset
  // ===========================================================================

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const audioTrack = createMockMediaStreamTrack('audio-1', 'audio');
      const stream = createMockMediaStream([audioTrack]);

      // Set up some state
      act(() => {
        useMediaStore.getState().setLocalStream(stream);
        useMediaStore.getState().setAudioEnabled(true);
        useMediaStore.getState().setVideoEnabled(true);
        useMediaStore.getState().setSpeaking(true);
        useMediaStore.getState().setAudioLevel(0.5);
        useMediaStore.getState().setPermissions(true, true);
        useMediaStore.getState().setSelectedAudioInput('mic-1');
      });

      // Reset
      act(() => {
        useMediaStore.getState().reset();
      });

      // Verify tracks were stopped
      expect(audioTrack.stop).toHaveBeenCalled();

      // Verify state was reset
      const state = useMediaStore.getState();
      expect(state.localStream).toBeNull();
      expect(state.isAudioEnabled).toBe(false);
      expect(state.isVideoEnabled).toBe(false);
      expect(state.isSpeaking).toBe(false);
      expect(state.audioLevel).toBe(0);
      expect(state.hasAudioPermission).toBe(false);
      expect(state.hasVideoPermission).toBe(false);
      expect(state.selectedAudioInput).toBeNull();
    });

    it('should handle reset with both local and screen share streams', () => {
      const localTrack = createMockMediaStreamTrack('local-1', 'audio');
      const screenTrack = createMockMediaStreamTrack('screen-1', 'video');
      const localStream = createMockMediaStream([localTrack]);
      const screenStream = createMockMediaStream([screenTrack]);

      act(() => {
        useMediaStore.getState().setLocalStream(localStream);
        useMediaStore.getState().setScreenShareStream(screenStream);
      });

      act(() => {
        useMediaStore.getState().reset();
      });

      expect(localTrack.stop).toHaveBeenCalled();
      expect(screenTrack.stop).toHaveBeenCalled();
    });
  });
});
