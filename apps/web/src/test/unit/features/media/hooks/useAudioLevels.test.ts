/**
 * useAudioLevels Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAudioLevels } from '@/features/media/hooks/useAudioLevels';

// Mock dependencies
vi.mock('@/shared/stores/media.store', () => ({
  useMediaStore: vi.fn(),
}));

vi.mock('@/features/media/hooks/useRemoteStreams', () => ({
  useRemoteStreams: vi.fn(),
}));

vi.mock('@/features/media/services/audio-analyzer.service', () => ({
  createAudioAnalyzer: vi.fn(),
  destroyAudioAnalyzer: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MediaStream
class MockMediaStream {
  id = 'mock-stream-id';
  getAudioTracks() {
    return [{ kind: 'audio', enabled: true }];
  }
  getVideoTracks() {
    return [];
  }
  getTracks() {
    return this.getAudioTracks();
  }
}

(global as unknown as { MediaStream: typeof MockMediaStream }).MediaStream =
  MockMediaStream;

import { useMediaStore } from '@/shared/stores/media.store';
import { useRemoteStreams } from '@/features/media/hooks/useRemoteStreams';
import {
  createAudioAnalyzer,
  destroyAudioAnalyzer,
} from '@/features/media/services/audio-analyzer.service';

const mockUseMediaStore = vi.mocked(useMediaStore);
const mockUseRemoteStreams = vi.mocked(useRemoteStreams);
const mockCreateAudioAnalyzer = vi.mocked(createAudioAnalyzer);
const mockDestroyAudioAnalyzer = vi.mocked(destroyAudioAnalyzer);

describe('useAudioLevels', () => {
  const mockAnalyzer = {
    start: vi.fn(),
    stop: vi.fn(),
    addStream: vi.fn(),
    removeStream: vi.fn(),
    getLevel: vi.fn(),
    getAllLevels: vi.fn(),
    destroy: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseMediaStore.mockImplementation((selector) => {
      const state = {
        localStream: null,
      };
      return selector(state as never);
    });

    mockUseRemoteStreams.mockReturnValue({
      streams: new Map(),
      getStream: vi.fn(),
      participantIds: [],
      hasScreenShare: vi.fn(() => false),
      screenShareParticipantId: null,
    });

    mockCreateAudioAnalyzer.mockReturnValue(
      mockAnalyzer as unknown as ReturnType<typeof createAudioAnalyzer>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create analyzer when enabled', () => {
      renderHook(() => useAudioLevels({ enabled: true }));

      expect(mockCreateAudioAnalyzer).toHaveBeenCalledWith({
        speakingThreshold: 30,
      });
      expect(mockAnalyzer.start).toHaveBeenCalled();
    });

    it('should not create analyzer when disabled', () => {
      renderHook(() => useAudioLevels({ enabled: false }));

      expect(mockCreateAudioAnalyzer).not.toHaveBeenCalled();
    });

    it('should destroy analyzer on unmount', () => {
      const { unmount } = renderHook(() => useAudioLevels({ enabled: true }));

      unmount();

      expect(mockDestroyAudioAnalyzer).toHaveBeenCalled();
    });
  });

  describe('speaking detection', () => {
    it('should initialize with empty speaking map', () => {
      const { result } = renderHook(() => useAudioLevels({ enabled: true }));

      expect(result.current.speakingMap.size).toBe(0);
    });

    it('should report isSpeaking as false for unknown participants', () => {
      const { result } = renderHook(() => useAudioLevels({ enabled: true }));

      expect(result.current.isSpeaking('unknown-id')).toBe(false);
    });

    it('should use custom speaking threshold', () => {
      renderHook(() =>
        useAudioLevels({ enabled: true, speakingThreshold: 50 })
      );

      expect(mockCreateAudioAnalyzer).toHaveBeenCalledWith({
        speakingThreshold: 50,
      });
    });
  });

  describe('stream tracking', () => {
    it('should add local stream when available', async () => {
      const mockLocalStream = new MockMediaStream() as unknown as MediaStream;

      mockUseMediaStore.mockImplementation((selector) => {
        const state = {
          localStream: mockLocalStream,
        };
        return selector(state as never);
      });

      renderHook(() =>
        useAudioLevels({
          enabled: true,
          localParticipantId: 'local-1',
        })
      );

      await waitFor(() => {
        expect(mockAnalyzer.addStream).toHaveBeenCalledWith(
          'local-1',
          mockLocalStream
        );
      });
    });

    it('should remove local stream when it becomes null', async () => {
      const mockLocalStream = new MockMediaStream() as unknown as MediaStream;

      // Start with stream
      mockUseMediaStore.mockImplementation((selector) => {
        const state = { localStream: mockLocalStream };
        return selector(state as never);
      });

      const { rerender } = renderHook(() =>
        useAudioLevels({
          enabled: true,
          localParticipantId: 'local-1',
        })
      );

      // Remove stream
      mockUseMediaStore.mockImplementation((selector) => {
        const state = { localStream: null };
        return selector(state as never);
      });

      rerender();

      await waitFor(() => {
        expect(mockAnalyzer.removeStream).toHaveBeenCalledWith('local-1');
      });
    });

    it('should track remote streams', async () => {
      const mockRemoteStream = new MockMediaStream() as unknown as MediaStream;

      mockUseRemoteStreams.mockReturnValue({
        streams: new Map([
          [
            'remote-1',
            {
              participantId: 'remote-1',
              mediaStream: mockRemoteStream,
              screenStream: null,
              audioTrack: null,
              videoTrack: null,
              screenTrack: null,
            },
          ],
        ]),
        getStream: vi.fn(),
        participantIds: ['remote-1'],
        hasScreenShare: vi.fn(() => false),
        screenShareParticipantId: null,
      });

      renderHook(() => useAudioLevels({ enabled: true }));

      await waitFor(() => {
        expect(mockAnalyzer.addStream).toHaveBeenCalledWith(
          'remote-1',
          mockRemoteStream
        );
      });
    });
  });

  describe('level helpers', () => {
    it('should return 0 for unknown participant level', () => {
      const { result } = renderHook(() => useAudioLevels({ enabled: true }));

      expect(result.current.getLevel('unknown-id')).toBe(0);
    });

    it('should return empty levels map initially', () => {
      const { result } = renderHook(() => useAudioLevels({ enabled: true }));

      expect(result.current.levelsMap.size).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should destroy analyzer when disabled', () => {
      const { rerender } = renderHook(
        ({ enabled }) => useAudioLevels({ enabled }),
        { initialProps: { enabled: true } }
      );

      rerender({ enabled: false });

      expect(mockDestroyAudioAnalyzer).toHaveBeenCalled();
    });
  });
});
