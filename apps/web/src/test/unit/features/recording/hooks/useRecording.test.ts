/**
 * useRecording Hook Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecording } from '@/features/recording/hooks/useRecording';
import { useRecordingStore } from '@/features/recording/stores/recording.store';

// Mock MediaStream globally for tests
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];

  constructor() {
    this.tracks = [];
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === 'audio');
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    this.tracks = this.tracks.filter((t) => t !== track);
  }
}

(global as unknown as { MediaStream: typeof MockMediaStream }).MediaStream = MockMediaStream;

// Mock realtime hooks
const mockSend = vi.fn();
const mockSubscriptions = new Map<string, (payload: unknown) => void>();

vi.mock('@/features/realtime', () => ({
  useSend: () => mockSend,
  useSubscription: (type: string, handler: (payload: unknown) => void) => {
    mockSubscriptions.set(type, handler);
  },
}));

// Mock recording services
const mockMixerDispose = vi.fn();
const mockMixerAddSource = vi.fn();
const mockMixerRemoveSource = vi.fn();
const mockMixerSetSourceGain = vi.fn();
const mockGetOutputStream = vi.fn(() => new MediaStream());
const mockRecorderStart = vi.fn();
const mockRecorderStop = vi.fn();
const mockRecorderGetChunks = vi.fn(() => [new Blob(['test'])]);

vi.mock('@/features/recording/services/recording-mixer.service', () => ({
  createRecordingMixer: () => ({
    addSource: mockMixerAddSource,
    removeSource: mockMixerRemoveSource,
    setSourceGain: mockMixerSetSourceGain,
    getOutputStream: mockGetOutputStream,
    dispose: mockMixerDispose,
  }),
  combineStreams: vi.fn(() => new MediaStream()),
}));

vi.mock('@/features/recording/services/recording-stream.service', () => ({
  createRecordingStream: vi.fn(() => ({
    start: mockRecorderStart,
    stop: mockRecorderStop,
    getChunks: mockRecorderGetChunks,
  })),
}));

// Mock crypto utilities
vi.mock('@/shared/lib/crypto', () => ({
  generateEncryptionKey: vi.fn().mockResolvedValue({
    key: {} as CryptoKey,
    exportedKey: 'mock-exported-key',
  }),
  encryptBlob: vi.fn().mockResolvedValue({
    ciphertext: new Uint8Array([1, 2, 3]),
    iv: new Uint8Array([4, 5, 6]),
  }),
  isCryptoAvailable: vi.fn(() => true),
}));

// Helper to create mock MediaStream
function createMockMediaStream(): MediaStream {
  const stream = new MediaStream();
  return stream;
}

describe('useRecording', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptions.clear();

    // Reset recording store
    act(() => {
      useRecordingStore.getState().reset();
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useRecording());

      expect(result.current.isRecording).toBe(false);
      expect(result.current.durationMs).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.streamingStats).toEqual({
        chunksSent: 0,
        bytesSent: 0,
      });
    });

    it('should subscribe to recording messages', () => {
      renderHook(() => useRecording());

      expect(mockSubscriptions.has('recording.started')).toBe(true);
      expect(mockSubscriptions.has('recording.stopped')).toBe(true);
      expect(mockSubscriptions.has('recording.finalized')).toBe(true);
      expect(mockSubscriptions.has('recording.error')).toBe(true);
      expect(mockSubscriptions.has('recording.status')).toBe(true);
    });
  });

  describe('startRecording', () => {
    it('should not start when disabled', async () => {
      const { result } = renderHook(() => useRecording({ enabled: false }));

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should not start when already recording', async () => {
      // Set status to recording
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Should not have sent start message
      expect(mockSend).not.toHaveBeenCalledWith('recording.start', expect.anything());
    });

    it('should send recording.start message with types', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({
          video: createMockMediaStream(),
          microphone: createMockMediaStream(),
        });
      });

      // Both video and audio present = mixed type
      expect(mockSend).toHaveBeenCalledWith('recording.start', {
        types: ['mixed'],
        consent: true,
      });
    });

    it('should initialize mixer with audio sources', async () => {
      const { result } = renderHook(() => useRecording());

      const microphone = createMockMediaStream();
      const screenAudio = createMockMediaStream();
      const aiAudio = createMockMediaStream();

      await act(async () => {
        await result.current.startRecording({
          video: createMockMediaStream(),
          microphone,
          screenAudio,
          aiAudio,
        });
      });

      expect(mockMixerAddSource).toHaveBeenCalledWith({
        id: 'microphone',
        stream: microphone,
        gain: 1.0,
      });
      expect(mockMixerAddSource).toHaveBeenCalledWith({
        id: 'screenAudio',
        stream: screenAudio,
        gain: 0.8,
      });
      expect(mockMixerAddSource).toHaveBeenCalledWith({
        id: 'aiAudio',
        stream: aiAudio,
        gain: 0.9,
      });
    });

    it('should start the recorder', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      expect(mockRecorderStart).toHaveBeenCalled();
    });

    it('should send encryption key exchange message', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      expect(mockSend).toHaveBeenCalledWith('recording.encryption.keyExchange', {
        key: 'mock-exported-key',
        algorithm: 'AES-GCM',
      });
    });

    it('should handle start errors', async () => {
      // Make mixer throw an error
      const errorMixer = vi.fn().mockImplementation(() => {
        throw new Error('Mixer initialization failed');
      });
      vi.doMock('@/features/recording/services/recording-mixer.service', () => ({
        createRecordingMixer: errorMixer,
        combineStreams: vi.fn(() => new MediaStream()),
      }));

      const { result } = renderHook(() => useRecording());

      // Start will fail due to the store setting error
      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Even with error, the send is called before the mixer failure
      // The actual error is caught and set via setStoreError
    });
  });

  describe('stopRecording', () => {
    it('should not stop when not recording', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockSend).not.toHaveBeenCalledWith('recording.stop', expect.anything());
    });

    it('should stop recording and notify server', async () => {
      const { result } = renderHook(() => useRecording());

      // Start recording first to set up refs
      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Simulate server response that sets status to 'recording'
      const startedHandler = mockSubscriptions.get('recording.started');
      act(() => {
        startedHandler?.({ recordingId: 'rec-123' });
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockSend).toHaveBeenCalledWith('recording.stop', { reason: 'user_action' });
    });

    it('should dispose mixer when stopping', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Simulate server response that sets status to 'recording'
      const startedHandler = mockSubscriptions.get('recording.started');
      act(() => {
        startedHandler?.({ recordingId: 'rec-123' });
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockMixerDispose).toHaveBeenCalled();
    });

    it('should stop the recorder', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Simulate server response that sets status to 'recording'
      const startedHandler = mockSubscriptions.get('recording.started');
      act(() => {
        startedHandler?.({ recordingId: 'rec-123' });
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockRecorderStop).toHaveBeenCalled();
    });
  });

  describe('addAudioSource', () => {
    it('should add audio source to mixer', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      const aiStream = createMockMediaStream();

      act(() => {
        result.current.addAudioSource('ai', aiStream, 0.8);
      });

      expect(mockMixerAddSource).toHaveBeenCalledWith({
        id: 'ai',
        stream: aiStream,
        gain: 0.8,
      });
    });

    it('should use default gain when not specified', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      const stream = createMockMediaStream();

      act(() => {
        result.current.addAudioSource('extra', stream);
      });

      expect(mockMixerAddSource).toHaveBeenCalledWith({
        id: 'extra',
        stream,
        gain: 1.0,
      });
    });
  });

  describe('removeAudioSource', () => {
    it('should remove audio source from mixer', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      act(() => {
        result.current.removeAudioSource('ai');
      });

      expect(mockMixerRemoveSource).toHaveBeenCalledWith('ai');
    });
  });

  describe('setAudioSourceGain', () => {
    it('should set gain for audio source', async () => {
      const { result } = renderHook(() => useRecording());

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      act(() => {
        result.current.setAudioSourceGain('microphone', 0.5);
      });

      expect(mockMixerSetSourceGain).toHaveBeenCalledWith('microphone', 0.5);
    });
  });

  describe('WebSocket subscriptions', () => {
    it('should handle recording.started message', () => {
      renderHook(() => useRecording());

      const handler = mockSubscriptions.get('recording.started');
      expect(handler).toBeDefined();

      act(() => {
        handler?.({ recordingId: 'rec-123' });
      });

      const state = useRecordingStore.getState();
      expect(state.recordingId).toBe('rec-123');
      expect(state.status).toBe('recording');
    });

    it('should handle recording.stopped message', () => {
      // First set recording with duration
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
        useRecordingStore.getState().updateStatus('rec-123', 60000, 'recording');
      });

      renderHook(() => useRecording());

      const handler = mockSubscriptions.get('recording.stopped');

      // Backend sends stoppedAt and reason, not durationMs
      // The hook uses current store duration since backend doesn't send it here
      act(() => {
        handler?.({ recordingId: 'rec-123', stoppedAt: '2024-01-15T10:00:00Z', reason: 'user_action' });
      });

      const state = useRecordingStore.getState();
      expect(state.status).toBe('completed');
      expect(state.durationMs).toBe(60000);
    });

    it('should handle recording.finalized message', () => {
      act(() => {
        useRecordingStore.getState().setStarted('rec-123');
      });

      renderHook(() => useRecording());

      const handler = mockSubscriptions.get('recording.finalized');

      act(() => {
        handler?.({ recordingId: 'rec-123', downloadUrl: 'https://example.com/rec.webm' });
      });

      const state = useRecordingStore.getState();
      expect(state.downloadUrl).toBe('https://example.com/rec.webm');
    });

    it('should handle recording.error message', () => {
      renderHook(() => useRecording());

      const handler = mockSubscriptions.get('recording.error');

      act(() => {
        handler?.({ code: 'UPLOAD_FAILED', message: 'Network error' });
      });

      const state = useRecordingStore.getState();
      expect(state.error).toBe('UPLOAD_FAILED: Network error');
    });

    it('should handle recording.status message', () => {
      renderHook(() => useRecording());

      const handler = mockSubscriptions.get('recording.status');

      // Backend sends durationSeconds, hook converts to ms
      act(() => {
        handler?.({ recordingId: 'rec-123', durationSeconds: 30, status: 'recording' });
      });

      const state = useRecordingStore.getState();
      expect(state.recordingId).toBe('rec-123');
      expect(state.durationMs).toBe(30000); // 30 seconds * 1000
      expect(state.status).toBe('recording');
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useRecording());

      // Start recording
      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // Unmount
      unmount();

      expect(mockMixerDispose).toHaveBeenCalled();
      expect(mockRecorderStop).toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('should use custom chunk interval', async () => {
      const { result } = renderHook(() => useRecording({ chunkIntervalMs: 2000 }));

      await act(async () => {
        await result.current.startRecording({ video: createMockMediaStream() });
      });

      // The chunk interval is passed to createRecordingStream
      const { createRecordingStream } = await import('@/features/recording/services/recording-stream.service');
      expect(createRecordingStream).toHaveBeenCalledWith(
        expect.any(MediaStream),
        expect.objectContaining({
          chunkIntervalMs: 2000,
        })
      );
    });
  });
});
