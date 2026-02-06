/**
 * useLocalMedia Hook Tests
 *
 * Tests for local media capture lifecycle management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalMedia } from '@/features/media/hooks/useLocalMedia';
import { useMediaStore } from '@/shared/stores/media.store';
import {
  installMockMediaDevices,
  uninstallMockMediaDevices,
  MockMediaStream,
  MockMediaStreamTrack,
  resetMediaMocks,
} from '@/test/mocks/media-devices.mock';

// Mock the media capture service
vi.mock('@/features/media/services/media-capture.service', () => ({
  mediaCaptureService: {
    capture: vi.fn(),
    captureScreen: vi.fn(),
    replaceTrack: vi.fn(),
    stopStream: vi.fn(),
    setTrackEnabled: vi.fn(),
  },
  stopStreamTracks: vi.fn(),
  stopStreamTracksWithCleanup: vi.fn(),
}));

import { mediaCaptureService } from '@/features/media/services/media-capture.service';

// =============================================================================
// Test Setup
// =============================================================================

describe('useLocalMedia', () => {
  beforeEach(() => {
    resetMediaMocks();
    installMockMediaDevices();
    useMediaStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    uninstallMockMediaDevices();
    vi.resetAllMocks();
  });

  // Helper to create mock capture result
  function createMockCaptureResult(options: { audio?: boolean; video?: boolean } = {}) {
    const audioTrack = options.audio !== false ? new MockMediaStreamTrack({ kind: 'audio' }) : null;
    const videoTrack = options.video !== false ? new MockMediaStreamTrack({ kind: 'video' }) : null;
    const stream = new MockMediaStream({
      audioTracks: audioTrack ? [{ kind: 'audio' }] : [],
      videoTracks: videoTrack ? [{ kind: 'video' }] : [],
    });

    return {
      stream,
      audioTrack: audioTrack ? (stream.getAudioTracks()[0] ?? null) : null,
      videoTrack: videoTrack ? (stream.getVideoTracks()[0] ?? null) : null,
    };
  }

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should return null stream and tracks initially', () => {
      const { result } = renderHook(() => useLocalMedia());

      expect(result.current.localStream).toBeNull();
      expect(result.current.audioTrack).toBeNull();
      expect(result.current.videoTrack).toBeNull();
    });

    it('should return disabled audio and video initially', () => {
      const { result } = renderHook(() => useLocalMedia());

      expect(result.current.isAudioEnabled).toBe(false);
      expect(result.current.isVideoEnabled).toBe(false);
    });

    it('should return no error initially', () => {
      const { result } = renderHook(() => useLocalMedia());

      expect(result.current.error).toBeNull();
    });

    it('should return not capturing initially', () => {
      const { result } = renderHook(() => useLocalMedia());

      expect(result.current.isCapturing).toBe(false);
    });
  });

  // ===========================================================================
  // startCapture
  // ===========================================================================

  describe('startCapture', () => {
    it('should capture audio and video by default', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(mediaCaptureService.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
          video: true,
        })
      );
    });

    it('should update store with stream and tracks', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.localStream).toBe(mockResult.stream);
      expect(result.current.audioTrack).toBe(mockResult.audioTrack);
      expect(result.current.videoTrack).toBe(mockResult.videoTrack);
    });

    it('should set audio and video enabled after capture', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.isAudioEnabled).toBe(true);
      expect(result.current.isVideoEnabled).toBe(true);
    });

    it('should respect audio-only capture option', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: false });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture({ audio: true, video: false });
      });

      expect(mediaCaptureService.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
          video: false,
        })
      );
    });

    it('should not capture again if already has stream', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      await act(async () => {
        await result.current.startCapture();
      });

      expect(mediaCaptureService.capture).toHaveBeenCalledTimes(1);
    });

    it('should throw error on capture failure', async () => {
      const error = { type: 'permission_denied', message: 'Permission denied' };
      vi.mocked(mediaCaptureService.capture).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLocalMedia());

      await expect(
        act(async () => {
          await result.current.startCapture();
        })
      ).rejects.toEqual(error);
    });

    it('should use selected device IDs when available', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      // Set selected devices in store
      useMediaStore.getState().setSelectedAudioInput('mic-123');
      useMediaStore.getState().setSelectedVideoInput('cam-456');

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(mediaCaptureService.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          audioDeviceId: 'mic-123',
          videoDeviceId: 'cam-456',
        })
      );
    });
  });

  // ===========================================================================
  // stopCapture
  // ===========================================================================

  describe('stopCapture', () => {
    it('should stop all tracks via store', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      act(() => {
        result.current.stopCapture();
      });

      expect(result.current.localStream).toBeNull();
      expect(result.current.audioTrack).toBeNull();
      expect(result.current.videoTrack).toBeNull();
    });

    it('should reset enabled states', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      act(() => {
        result.current.stopCapture();
      });

      expect(result.current.isAudioEnabled).toBe(false);
      expect(result.current.isVideoEnabled).toBe(false);
    });
  });

  // ===========================================================================
  // toggleAudio
  // ===========================================================================

  describe('toggleAudio', () => {
    it('should toggle audio track enabled state', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.isAudioEnabled).toBe(true);

      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.isAudioEnabled).toBe(false);

      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.isAudioEnabled).toBe(true);
    });

    it('should do nothing when no audio track', () => {
      const { result } = renderHook(() => useLocalMedia());

      // Should not throw
      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.isAudioEnabled).toBe(false);
    });
  });

  // ===========================================================================
  // toggleVideo
  // ===========================================================================

  describe('toggleVideo', () => {
    it('should toggle video track enabled state', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.isVideoEnabled).toBe(true);

      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoEnabled).toBe(false);

      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoEnabled).toBe(true);
    });

    it('should do nothing when no video track', () => {
      const { result } = renderHook(() => useLocalMedia());

      // Should not throw
      act(() => {
        result.current.toggleVideo();
      });

      expect(result.current.isVideoEnabled).toBe(false);
    });
  });

  // ===========================================================================
  // setAudioEnabled / setVideoEnabled
  // ===========================================================================

  describe('setAudioEnabled', () => {
    it('should set audio enabled state directly', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      act(() => {
        result.current.setAudioEnabled(false);
      });

      expect(result.current.isAudioEnabled).toBe(false);

      act(() => {
        result.current.setAudioEnabled(true);
      });

      expect(result.current.isAudioEnabled).toBe(true);
    });
  });

  describe('setVideoEnabled', () => {
    it('should set video enabled state directly', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      act(() => {
        result.current.setVideoEnabled(false);
      });

      expect(result.current.isVideoEnabled).toBe(false);

      act(() => {
        result.current.setVideoEnabled(true);
      });

      expect(result.current.isVideoEnabled).toBe(true);
    });
  });

  // ===========================================================================
  // switchAudioDevice
  // ===========================================================================

  describe('switchAudioDevice', () => {
    it('should replace audio track with new device', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const newTrack = new MockMediaStreamTrack({ kind: 'audio' });
      vi.mocked(mediaCaptureService.replaceTrack).mockResolvedValueOnce(newTrack);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      await act(async () => {
        await result.current.switchAudioDevice('new-mic-id');
      });

      expect(mediaCaptureService.replaceTrack).toHaveBeenCalledWith(
        mockResult.stream,
        'audio',
        'new-mic-id'
      );
    });

    it('should update store with new audio track', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const newTrack = new MockMediaStreamTrack({ kind: 'audio' });
      vi.mocked(mediaCaptureService.replaceTrack).mockResolvedValueOnce(newTrack);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      const oldTrack = result.current.audioTrack;

      await act(async () => {
        await result.current.switchAudioDevice('new-mic-id');
      });

      expect(result.current.audioTrack).toBe(newTrack);
      expect(result.current.audioTrack).not.toBe(oldTrack);
    });

    it('should do nothing when no local stream', async () => {
      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.switchAudioDevice('new-mic-id');
      });

      expect(mediaCaptureService.replaceTrack).not.toHaveBeenCalled();
    });

    it('should throw error on replace failure', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const error = { type: 'device_not_found', message: 'Device not found' };
      vi.mocked(mediaCaptureService.replaceTrack).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      await expect(
        act(async () => {
          await result.current.switchAudioDevice('invalid-id');
        })
      ).rejects.toEqual(error);
    });
  });

  // ===========================================================================
  // switchVideoDevice
  // ===========================================================================

  describe('switchVideoDevice', () => {
    it('should replace video track with new device', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const newTrack = new MockMediaStreamTrack({ kind: 'video' });
      vi.mocked(mediaCaptureService.replaceTrack).mockResolvedValueOnce(newTrack);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      await act(async () => {
        await result.current.switchVideoDevice('new-cam-id');
      });

      expect(mediaCaptureService.replaceTrack).toHaveBeenCalledWith(
        mockResult.stream,
        'video',
        'new-cam-id'
      );
    });

    it('should update store with new video track', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      const newTrack = new MockMediaStreamTrack({ kind: 'video' });
      vi.mocked(mediaCaptureService.replaceTrack).mockResolvedValueOnce(newTrack);

      const { result } = renderHook(() => useLocalMedia());

      await act(async () => {
        await result.current.startCapture();
      });

      const oldTrack = result.current.videoTrack;

      await act(async () => {
        await result.current.switchVideoDevice('new-cam-id');
      });

      expect(result.current.videoTrack).toBe(newTrack);
      expect(result.current.videoTrack).not.toBe(oldTrack);
    });
  });

  // ===========================================================================
  // autoStart
  // ===========================================================================

  describe('autoStart option', () => {
    it('should auto-start capture when autoStart is true', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      renderHook(() => useLocalMedia({ autoStart: true }));

      await waitFor(() => {
        expect(mediaCaptureService.capture).toHaveBeenCalled();
      });
    });

    it('should not auto-start when autoStart is false', async () => {
      renderHook(() => useLocalMedia({ autoStart: false }));

      // Wait a bit to ensure no capture started
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mediaCaptureService.capture).not.toHaveBeenCalled();
    });

    it('should use audioEnabled option for auto-start', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: false });
      vi.mocked(mediaCaptureService.capture).mockResolvedValueOnce(mockResult);

      renderHook(() =>
        useLocalMedia({ autoStart: true, audioEnabled: true, videoEnabled: false })
      );

      await waitFor(() => {
        expect(mediaCaptureService.capture).toHaveBeenCalledWith(
          expect.objectContaining({
            audio: true,
            video: false,
          })
        );
      });
    });
  });

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  describe('cleanup', () => {
    it('should set mountedRef to false on unmount', async () => {
      const mockResult = createMockCaptureResult({ audio: true, video: true });

      // Create a deferred promise we can resolve after unmount
      let resolveCapture: (value: typeof mockResult) => void;
      const capturePromise = new Promise<typeof mockResult>((resolve) => {
        resolveCapture = resolve;
      });

      vi.mocked(mediaCaptureService.capture).mockReturnValueOnce(capturePromise);

      const { result, unmount } = renderHook(() => useLocalMedia());

      // Start capture (will be pending)
      const captureCall = result.current.startCapture();

      // Unmount before capture completes
      unmount();

      // Resolve capture after unmount
      resolveCapture!(mockResult);

      await captureCall;

      // Stream should be stopped since component unmounted
      expect(mediaCaptureService.stopStream).toHaveBeenCalledWith(mockResult.stream);
    });
  });
});
