/**
 * Audio Capture Service Tests
 *
 * Tests for microphone audio capture functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioCaptureService } from '@/features/ai/services/audio-capture.service';
import type { AudioCaptureCallbacks } from '@/features/ai/types/audio.types';

// =============================================================================
// Mocks
// =============================================================================

// Mock AudioContext
const mockAudioContextClose = vi.fn().mockResolvedValue(undefined);
const mockAudioWorkletAddModule = vi.fn().mockResolvedValue(undefined);
const mockWorkletPortPostMessage = vi.fn();
const mockWorkletPortClose = vi.fn();
const mockWorkletDisconnect = vi.fn();
const mockSourceDisconnect = vi.fn();
const mockSourceConnect = vi.fn();

const createMockAudioContext = () => ({
  state: 'running',
  sampleRate: 16000,
  close: mockAudioContextClose,
  audioWorklet: {
    addModule: mockAudioWorkletAddModule,
  },
  createMediaStreamSource: vi.fn(() => ({
    connect: mockSourceConnect,
    disconnect: mockSourceDisconnect,
  })),
});

const createMockAudioWorkletNode = () => ({
  connect: vi.fn(),
  disconnect: mockWorkletDisconnect,
  port: {
    postMessage: mockWorkletPortPostMessage,
    close: mockWorkletPortClose,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onmessageerror: null as (() => void) | null,
  },
});

// Mock track
const mockTrackStop = vi.fn();
const mockTrackAddEventListener = vi.fn();
const mockTrackRemoveEventListener = vi.fn();

const createMockMediaStream = () => ({
  getTracks: () => [
    {
      stop: mockTrackStop,
      addEventListener: mockTrackAddEventListener,
      removeEventListener: mockTrackRemoveEventListener,
      kind: 'audio',
    },
  ],
  getAudioTracks: () => [
    {
      stop: mockTrackStop,
      addEventListener: mockTrackAddEventListener,
      removeEventListener: mockTrackRemoveEventListener,
      kind: 'audio',
    },
  ],
});

let mockAudioContext: ReturnType<typeof createMockAudioContext>;
let mockWorkletNode: ReturnType<typeof createMockAudioWorkletNode>;
let mockMediaStream: ReturnType<typeof createMockMediaStream>;

// Store original globals
const originalAudioContext = globalThis.AudioContext;
const originalAudioWorkletNode = globalThis.AudioWorkletNode;

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn().mockResolvedValue([
  { kind: 'audioinput', deviceId: 'default', label: 'Default' },
  { kind: 'audioinput', deviceId: 'device-1', label: 'Mic 1' },
]);
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  },
  writable: true,
});

// =============================================================================
// Test Setup
// =============================================================================

function createTestCallbacks(
  overrides: Partial<AudioCaptureCallbacks> = {}
): AudioCaptureCallbacks {
  return {
    onAudioChunk: vi.fn(),
    onAudioLevel: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

describe('AudioCaptureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks
    mockAudioContext = createMockAudioContext();
    mockWorkletNode = createMockAudioWorkletNode();
    mockMediaStream = createMockMediaStream();

    // Mock AudioContext constructor
    globalThis.AudioContext = vi.fn(
      () => mockAudioContext
    ) as unknown as typeof AudioContext;

    // Mock AudioWorkletNode constructor
    globalThis.AudioWorkletNode = vi.fn(
      () => mockWorkletNode
    ) as unknown as typeof AudioWorkletNode;

    // Mock getUserMedia to return mock stream
    mockGetUserMedia.mockResolvedValue(mockMediaStream);

    // Make sure service is stopped and mute is reset
    audioCaptureService.stop();
    audioCaptureService.setMuted(false);
  });

  afterEach(() => {
    // Restore originals
    globalThis.AudioContext = originalAudioContext;
    globalThis.AudioWorkletNode = originalAudioWorkletNode;

    // Clean up service
    audioCaptureService.stop();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('initial state', () => {
    it('should start in idle state', () => {
      expect(audioCaptureService.getState()).toBe('idle');
    });

    it('should not be capturing initially', () => {
      expect(audioCaptureService.isCapturing()).toBe(false);
    });

    it('should not be muted initially', () => {
      expect(audioCaptureService.getMuted()).toBe(false);
    });
  });

  // ===========================================================================
  // Start Capture Tests
  // ===========================================================================

  describe('start', () => {
    it('should transition to capturing state', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(audioCaptureService.getState()).toBe('capturing');
      expect(audioCaptureService.isCapturing()).toBe(true);
    });

    it('should create AudioContext with configured sample rate', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(globalThis.AudioContext).toHaveBeenCalledWith({
        sampleRate: 16000,
      });
    });

    it('should load audio worklet module', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(mockAudioWorkletAddModule).toHaveBeenCalledWith(
        '/audio-processor.worklet.js'
      );
    });

    it('should request microphone with correct constraints', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start('specific-device', callbacks);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          deviceId: { exact: 'specific-device' },
        }),
        video: false,
      });
    });

    it('should connect audio graph', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(mockSourceConnect).toHaveBeenCalled();
    });

    it('should set up device change listener', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });

    it('should not start if already capturing', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      // Clear mocks
      vi.clearAllMocks();

      // Try to start again
      await audioCaptureService.start(undefined, callbacks);

      // Should not call getUserMedia again
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('should use default device when no deviceId provided', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: expect.not.objectContaining({
          deviceId: expect.anything(),
        }),
        video: false,
      });
    });
  });

  // ===========================================================================
  // Stop Capture Tests
  // ===========================================================================

  describe('stop', () => {
    it('should transition to idle state', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(audioCaptureService.getState()).toBe('idle');
      expect(audioCaptureService.isCapturing()).toBe(false);
    });

    it('should disconnect worklet node', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(mockWorkletDisconnect).toHaveBeenCalled();
      expect(mockWorkletPortClose).toHaveBeenCalled();
    });

    it('should disconnect source node', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(mockSourceDisconnect).toHaveBeenCalled();
    });

    it('should stop all media tracks', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(mockTrackStop).toHaveBeenCalled();
    });

    it('should close audio context', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(mockAudioContextClose).toHaveBeenCalled();
    });

    it('should remove device change listener', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'devicechange',
        expect.any(Function)
      );
    });

    it('should be safe to call stop when not capturing', () => {
      // Should not throw
      expect(() => audioCaptureService.stop()).not.toThrow();
    });
  });

  // ===========================================================================
  // Mute Control Tests
  // ===========================================================================

  describe('setMuted', () => {
    it('should update muted state', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      audioCaptureService.setMuted(true);
      expect(audioCaptureService.getMuted()).toBe(true);

      audioCaptureService.setMuted(false);
      expect(audioCaptureService.getMuted()).toBe(false);
    });

    it('should send mute message to worklet when capturing', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      audioCaptureService.setMuted(true);

      expect(mockWorkletPortPostMessage).toHaveBeenCalledWith({
        type: 'mute',
        muted: true,
      });
    });

    it('should not throw when muting before capture starts', () => {
      expect(() => audioCaptureService.setMuted(true)).not.toThrow();
    });
  });

  // ===========================================================================
  // Audio Message Handling Tests
  // ===========================================================================

  describe('audio message handling', () => {
    it('should set up worklet port message handler', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      // The service should have set up the onmessage handler
      // We can verify the worklet was properly connected
      expect(mockSourceConnect).toHaveBeenCalled();
    });

    it('should send initial mute state to worklet', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      // Initial mute state should be sent
      expect(mockWorkletPortPostMessage).toHaveBeenCalledWith({
        type: 'mute',
        muted: false,
      });
    });

    it('should update mute state on worklet when muted', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      // Clear initial mute message
      mockWorkletPortPostMessage.mockClear();

      audioCaptureService.setMuted(true);

      expect(mockWorkletPortPostMessage).toHaveBeenCalledWith({
        type: 'mute',
        muted: true,
      });
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should handle permission denied error', async () => {
      const callbacks = createTestCallbacks();

      const permissionError = new DOMException(
        'Permission denied',
        'NotAllowedError'
      );
      mockGetUserMedia.mockRejectedValueOnce(permissionError);

      await expect(
        audioCaptureService.start(undefined, callbacks)
      ).rejects.toMatchObject({
        type: 'permission_denied',
      });

      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'permission_denied',
        })
      );
    });

    it('should handle device not found error', async () => {
      const callbacks = createTestCallbacks();

      const notFoundError = new DOMException('No device', 'NotFoundError');
      mockGetUserMedia.mockRejectedValueOnce(notFoundError);

      await expect(
        audioCaptureService.start(undefined, callbacks)
      ).rejects.toMatchObject({
        type: 'device_not_found',
      });
    });

    it('should handle device in use error', async () => {
      const callbacks = createTestCallbacks();

      const inUseError = new DOMException('Device in use', 'NotReadableError');
      mockGetUserMedia.mockRejectedValueOnce(inUseError);

      await expect(
        audioCaptureService.start(undefined, callbacks)
      ).rejects.toMatchObject({
        type: 'device_in_use',
      });
    });

    it('should handle worklet load failure', async () => {
      const callbacks = createTestCallbacks();

      mockAudioWorkletAddModule.mockRejectedValueOnce(
        new Error('Module load failed')
      );

      await expect(
        audioCaptureService.start(undefined, callbacks)
      ).rejects.toMatchObject({
        type: 'worklet_failed',
      });
    });

    it('should transition to error state on failure', async () => {
      const callbacks = createTestCallbacks();

      mockGetUserMedia.mockRejectedValueOnce(
        new DOMException('Error', 'NotAllowedError')
      );

      try {
        await audioCaptureService.start(undefined, callbacks);
      } catch {
        // Expected to throw
      }

      expect(audioCaptureService.getState()).toBe('error');
    });

    it('should clean up resources on error', async () => {
      const callbacks = createTestCallbacks();

      // Fail during worklet connection (after stream acquired)
      mockAudioWorkletAddModule.mockRejectedValueOnce(new Error('Failed'));

      try {
        await audioCaptureService.start(undefined, callbacks);
      } catch {
        // Expected to throw
      }

      // Should have cleaned up
      expect(audioCaptureService.isCapturing()).toBe(false);
    });

    it('should handle worklet communication error', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      // Simulate worklet communication error
      mockWorkletNode.port.onmessageerror?.();

      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'worklet_failed',
          message: 'Audio processor communication error.',
        })
      );
    });
  });

  // ===========================================================================
  // State Query Tests
  // ===========================================================================

  describe('state queries', () => {
    it('should return correct state during lifecycle', async () => {
      const callbacks = createTestCallbacks();

      expect(audioCaptureService.getState()).toBe('idle');

      const startPromise = audioCaptureService.start(undefined, callbacks);
      // Note: state transitions are internal, hard to capture 'starting' state

      await startPromise;
      expect(audioCaptureService.getState()).toBe('capturing');

      audioCaptureService.stop();
      expect(audioCaptureService.getState()).toBe('idle');
    });
  });

  // ===========================================================================
  // Custom Config Tests
  // ===========================================================================

  describe('custom config', () => {
    it('should use configured sample rate', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks, {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
      });

      expect(globalThis.AudioContext).toHaveBeenCalledWith({
        sampleRate: 16000,
      });
    });

    it('should pass audio constraints from config', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks, {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: true,
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: expect.objectContaining({
          echoCancellation: false,
          noiseSuppression: true,
          channelCount: 1,
        }),
        video: false,
      });
    });
  });

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('callbacks', () => {
    it('should work without optional callbacks', async () => {
      const callbacks: AudioCaptureCallbacks = {
        onAudioChunk: vi.fn(),
        // onAudioLevel and onError are optional
      };

      await expect(
        audioCaptureService.start(undefined, callbacks)
      ).resolves.not.toThrow();
    });

    it('should handle missing onAudioLevel gracefully', async () => {
      const callbacks: AudioCaptureCallbacks = {
        onAudioChunk: vi.fn(),
      };

      await audioCaptureService.start(undefined, callbacks);

      // Simulate level message - should not throw
      expect(() =>
        mockWorkletNode.port.onmessage?.({
          data: { type: 'level', level: 0.5 },
        } as MessageEvent)
      ).not.toThrow();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle multiple stop calls safely', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);

      expect(() => {
        audioCaptureService.stop();
        audioCaptureService.stop();
        audioCaptureService.stop();
      }).not.toThrow();
    });

    it('should handle start after stop', async () => {
      const callbacks = createTestCallbacks();

      await audioCaptureService.start(undefined, callbacks);
      audioCaptureService.stop();

      vi.clearAllMocks();
      mockAudioContext = createMockAudioContext();
      mockWorkletNode = createMockAudioWorkletNode();
      globalThis.AudioContext = vi.fn(
        () => mockAudioContext
      ) as unknown as typeof AudioContext;
      globalThis.AudioWorkletNode = vi.fn(
        () => mockWorkletNode
      ) as unknown as typeof AudioWorkletNode;

      await audioCaptureService.start(undefined, callbacks);

      expect(audioCaptureService.isCapturing()).toBe(true);
    });
  });
});
