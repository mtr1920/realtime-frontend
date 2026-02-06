/**
 * useScreenShare Hook Tests
 *
 * Tests for screen sharing management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScreenShare } from '@/features/media/hooks/useScreenShare';
import { useMediaStore } from '@/shared/stores/media.store';
import {
  installMockMediaDevices,
  uninstallMockMediaDevices,
  MockMediaStream,
  resetMediaMocks,
} from '@/test/mocks/media-devices.mock';
import type { MockMediaStreamTrack } from '@/test/mocks/media-devices.mock';

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

// Mock WebRTC context
const mockWebRTCContext = {
  service: null,
  isInitialized: false,
  initialize: vi.fn(),
  shutdown: vi.fn(),
  setLocalStream: vi.fn(),
  setScreenShareStream: vi.fn(),
  connectToParticipant: vi.fn(),
  disconnectFromParticipant: vi.fn(),
};

// Mutable ref so tests can override the return value (e.g., null for missing context)
let optionalWebRTCContextOverride: typeof mockWebRTCContext | null = mockWebRTCContext;

vi.mock('@/features/media/context/WebRTCContext', () => ({
  useWebRTCContext: () => mockWebRTCContext,
  useOptionalWebRTCContext: () => optionalWebRTCContextOverride,
}));

import { mediaCaptureService, stopStreamTracksWithCleanup } from '@/features/media/services/media-capture.service';

// =============================================================================
// Test Setup
// =============================================================================

describe('useScreenShare', () => {
  beforeEach(() => {
    resetMediaMocks();
    installMockMediaDevices();
    useMediaStore.getState().reset();
    vi.clearAllMocks();

    // Re-apply stopStreamTracksWithCleanup implementation (vi.resetAllMocks clears it)
    vi.mocked(stopStreamTracksWithCleanup).mockImplementation((stream: MediaStream | null) => {
      if (!stream) return;
      stream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    });

    // Reset mock context
    mockWebRTCContext.isInitialized = false;
    mockWebRTCContext.setScreenShareStream.mockClear();
    optionalWebRTCContextOverride = mockWebRTCContext;
  });

  afterEach(() => {
    uninstallMockMediaDevices();
    vi.resetAllMocks();
  });

  // Helper to create mock screen share result
  function createMockScreenShareResult() {
    const stream = new MockMediaStream({
      videoTracks: [{ kind: 'video', label: 'Screen Share' }],
    });

    return {
      stream,
      videoTrack: stream.getVideoTracks()[0] ?? null,
      audioTrack: null,
    };
  }

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should return not sharing initially', () => {
      const { result } = renderHook(() => useScreenShare());

      expect(result.current.isScreenSharing).toBe(false);
    });

    it('should return null stream initially', () => {
      const { result } = renderHook(() => useScreenShare());

      expect(result.current.screenShareStream).toBeNull();
    });

    it('should return no error initially', () => {
      const { result } = renderHook(() => useScreenShare());

      expect(result.current.error).toBeNull();
    });
  });

  // ===========================================================================
  // startScreenShare
  // ===========================================================================

  describe('startScreenShare', () => {
    it('should call captureScreen service', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(mediaCaptureService.captureScreen).toHaveBeenCalled();
    });

    it('should update store with screen share stream', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(result.current.screenShareStream).toBe(mockResult.stream);
      expect(result.current.isScreenSharing).toBe(true);
    });

    it('should pass options to captureScreen', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare({ audio: true });
      });

      expect(mediaCaptureService.captureScreen).toHaveBeenCalledWith({ audio: true });
    });

    it('should not start if already sharing', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(mediaCaptureService.captureScreen).toHaveBeenCalledTimes(1);
    });

    it('should sync with WebRTC service when initialized', async () => {
      mockWebRTCContext.isInitialized = true;

      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(mockWebRTCContext.setScreenShareStream).toHaveBeenCalledWith(mockResult.stream);
    });

    it('should not sync with WebRTC when not initialized', async () => {
      mockWebRTCContext.isInitialized = false;

      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(mockWebRTCContext.setScreenShareStream).not.toHaveBeenCalled();
    });

    it('should throw error on capture failure', async () => {
      const error = { type: 'permission_denied', message: 'Permission denied' };
      vi.mocked(mediaCaptureService.captureScreen).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useScreenShare());

      await expect(
        act(async () => {
          await result.current.startScreenShare();
        })
      ).rejects.toEqual(error);
    });
  });

  // ===========================================================================
  // stopScreenShare
  // ===========================================================================

  describe('stopScreenShare', () => {
    it('should stop all tracks and clear stream', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(result.current.isScreenSharing).toBe(true);

      act(() => {
        result.current.stopScreenShare();
      });

      expect(result.current.isScreenSharing).toBe(false);
      expect(result.current.screenShareStream).toBeNull();
    });

    it('should clear WebRTC service screen share when initialized', async () => {
      mockWebRTCContext.isInitialized = true;

      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      // Clear previous calls
      mockWebRTCContext.setScreenShareStream.mockClear();

      act(() => {
        result.current.stopScreenShare();
      });

      expect(mockWebRTCContext.setScreenShareStream).toHaveBeenCalledWith(null);
    });

    it('should remove onended handler from track', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      const videoTrack = mockResult.stream.getVideoTracks()[0]!;

      act(() => {
        result.current.stopScreenShare();
      });

      expect(videoTrack.onended).toBeNull();
    });
  });

  // ===========================================================================
  // Browser-Initiated Stop
  // ===========================================================================

  describe('browser-initiated stop', () => {
    it('should stop screen share when track ends', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(result.current.isScreenSharing).toBe(true);

      // Simulate browser "Stop sharing" button
      const videoTrack = mockResult.stream.getVideoTracks()[0] as MockMediaStreamTrack;

      act(() => {
        videoTrack.stop();
      });

      await waitFor(() => {
        expect(result.current.isScreenSharing).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Cleanup on Unmount
  // ===========================================================================

  // ===========================================================================
  // WebRTC Context Not Available
  // ===========================================================================

  describe('when WebRTC context is not available', () => {
    it('should not throw and return default state', () => {
      optionalWebRTCContextOverride = null;

      const { result } = renderHook(() => useScreenShare());

      expect(result.current.isScreenSharing).toBe(false);
      expect(result.current.screenShareStream).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should allow starting screen share without WebRTC sync', async () => {
      optionalWebRTCContextOverride = null;

      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      expect(result.current.isScreenSharing).toBe(true);
      expect(result.current.screenShareStream).toBe(mockResult.stream);
      // Should not have called WebRTC setScreenShareStream since context is null
      expect(mockWebRTCContext.setScreenShareStream).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Cleanup on Unmount
  // ===========================================================================

  describe('cleanup on unmount', () => {
    it('should stop tracks on unmount while sharing', async () => {
      const mockResult = createMockScreenShareResult();
      vi.mocked(mediaCaptureService.captureScreen).mockResolvedValueOnce(mockResult);

      const videoTrack = mockResult.stream.getVideoTracks()[0] as MockMediaStreamTrack;
      const stopSpy = vi.spyOn(videoTrack, 'stop');

      const { result, unmount } = renderHook(() => useScreenShare());

      await act(async () => {
        await result.current.startScreenShare();
      });

      unmount();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should stop stream if component unmounts during capture', async () => {
      const mockResult = createMockScreenShareResult();

      // Create deferred promise
      let resolveCapture: (value: typeof mockResult) => void;
      const capturePromise = new Promise<typeof mockResult>((resolve) => {
        resolveCapture = resolve;
      });

      vi.mocked(mediaCaptureService.captureScreen).mockReturnValueOnce(capturePromise);

      const { result, unmount } = renderHook(() => useScreenShare());

      // Start capture (will be pending)
      const captureCall = result.current.startScreenShare();

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
