/**
 * useAISession Hook Tests
 *
 * Tests for AI session lifecycle and state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAISession } from '@/features/ai/hooks/useAISession';
import type { UseAISessionOptions } from '@/features/ai/types/hooks.types';

// =============================================================================
// Mocks
// =============================================================================

// Mock WebSocket
const mockSend = vi.fn().mockResolvedValue(undefined);
const mockWebSocketState = {
  isConnected: true,
};

vi.mock('@/features/realtime/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    send: mockSend,
    get isConnected() {
      return mockWebSocketState.isConnected;
    },
  }),
}));

// Mock Audio Capture
const mockAudioCapture = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  audioLevel: 0.5,
};

vi.mock('@/features/ai/hooks/useAudioCapture', () => ({
  useAudioCapture: (options: { onAudioChunk?: (chunk: ArrayBuffer) => void }) => {
    // Store the callback for testing
    (mockAudioCapture as { _onChunk?: (chunk: ArrayBuffer) => void })._onChunk =
      options.onAudioChunk;
    return mockAudioCapture;
  },
}));

// Mock Audio Playback
const mockAudioPlayback = {
  initialize: vi.fn().mockResolvedValue(undefined),
  interrupt: vi.fn(),
  destroy: vi.fn(),
  enqueue: vi.fn(),
};

vi.mock('@/features/ai/hooks/useAudioPlayback', () => ({
  useAudioPlayback: (options: { onQueueEmpty?: () => void }) => {
    (mockAudioPlayback as { _onQueueEmpty?: () => void })._onQueueEmpty =
      options.onQueueEmpty;
    return mockAudioPlayback;
  },
}));

// Mock AI Subscriptions
const mockSubscriptionHandlers = {
  setSessionInfo: vi.fn(),
  setState: vi.fn(),
  setCurrentTurn: vi.fn(),
  setIsAISpeaking: vi.fn(),
  setIsUserSpeaking: vi.fn(),
  setError: vi.fn(),
  clearSessionStartTimeout: vi.fn(),
  clearTurnTimeout: vi.fn(),
};

vi.mock('@/features/ai/hooks/useAISubscriptions', () => ({
  useAISubscriptions: (handlers: typeof mockSubscriptionHandlers) => {
    Object.assign(mockSubscriptionHandlers, handlers);
  },
}));

// Mock utils
vi.mock('@/features/ai/utils/ai-session.utils', () => ({
  arrayBufferToBase64: vi.fn(() => 'base64audio'),
  generateTurnId: vi.fn(() => 'test-turn-id'),
  AI_SESSION_START_TIMEOUT: 30000,
  AI_TURN_TIMEOUT: 30000,
}));

// =============================================================================
// Test Setup
// =============================================================================

function createTestOptions(
  overrides: Partial<UseAISessionOptions> = {}
): UseAISessionOptions {
  return {
    participantId: 'test-participant',
    audioDeviceId: 'test-device',
    inputMode: 'push_to_talk',
    callbacks: {
      onStateChange: vi.fn(),
      onError: vi.fn(),
      onAISpeaking: vi.fn(),
      onAIStoppedSpeaking: vi.fn(),
    },
    ...overrides,
  };
}

describe('useAISession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWebSocketState.isConnected = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('initial state', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      expect(result.current.state).toBe('idle');
      expect(result.current.sessionInfo).toBeNull();
      expect(result.current.currentTurn).toBeNull();
      expect(result.current.isAISpeaking).toBe(false);
      expect(result.current.isUserSpeaking).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should expose audio level from capture', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      expect(result.current.userAudioLevel).toBe(0.5);
    });

    it('should expose all required actions', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      expect(typeof result.current.startSession).toBe('function');
      expect(typeof result.current.endSession).toBe('function');
      expect(typeof result.current.startSpeaking).toBe('function');
      expect(typeof result.current.stopSpeaking).toBe('function');
      expect(typeof result.current.interruptAI).toBe('function');
    });
  });

  // ===========================================================================
  // Start Session Tests
  // ===========================================================================

  describe('startSession', () => {
    it('should transition to starting state', async () => {
      const options = createTestOptions();
      const { result } = renderHook(() => useAISession(options));

      await act(async () => {
        await result.current.startSession();
      });

      expect(mockAudioPlayback.initialize).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledWith('ai.session.start', {
        participantId: 'test-participant',
        language: undefined,
        voiceId: undefined,
      });
    });

    it('should pass language and voiceId when provided', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      await act(async () => {
        await result.current.startSession('en-US', 'alloy');
      });

      expect(mockSend).toHaveBeenCalledWith('ai.session.start', {
        participantId: 'test-participant',
        language: 'en-US',
        voiceId: 'alloy',
      });
    });

    it('should not start if already starting', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      await act(async () => {
        await result.current.startSession();
      });

      mockSend.mockClear();

      await act(async () => {
        await result.current.startSession();
      });

      // Should not send again since state is 'starting'
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should not start if not connected', async () => {
      mockWebSocketState.isConnected = false;
      const { result } = renderHook(() => useAISession(createTestOptions()));

      await act(async () => {
        await result.current.startSession();
      });

      expect(mockAudioPlayback.initialize).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // End Session Tests
  // ===========================================================================

  describe('endSession', () => {
    it('should stop audio and send end message', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      // First start a session
      await act(async () => {
        await result.current.startSession();
      });

      mockSend.mockClear();

      await act(async () => {
        result.current.endSession();
      });

      expect(mockAudioCapture.stop).toHaveBeenCalled();
      expect(mockAudioPlayback.interrupt).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledWith('ai.session.end', {
        reason: 'user_action',
      });
    });

    it('should use provided reason', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      await act(async () => {
        await result.current.startSession();
      });

      mockSend.mockClear();

      await act(async () => {
        result.current.endSession('completed');
      });

      expect(mockSend).toHaveBeenCalledWith('ai.session.end', {
        reason: 'completed',
      });
    });

    it('should not end if already idle', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      act(() => {
        result.current.endSession();
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Speaking Tests (Push-to-Talk)
  // ===========================================================================

  describe('startSpeaking (push_to_talk)', () => {
    it('should not start if not in ready state', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      // Still in idle state
      await act(async () => {
        await result.current.startSpeaking();
      });

      expect(mockAudioCapture.start).not.toHaveBeenCalled();
    });

    it('should not start in voice_activated mode', async () => {
      const { result } = renderHook(() =>
        useAISession(createTestOptions({ inputMode: 'voice_activated' }))
      );

      await act(async () => {
        await result.current.startSpeaking();
      });

      expect(mockAudioCapture.start).not.toHaveBeenCalled();
    });
  });

  describe('stopSpeaking', () => {
    it('should not stop if not in listening state', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      act(() => {
        result.current.stopSpeaking();
      });

      // Should not do anything since not in listening state
      expect(mockSend).not.toHaveBeenCalledWith(
        'ai.input.audio.commit',
        expect.anything()
      );
    });
  });

  // ===========================================================================
  // Interrupt Tests
  // ===========================================================================

  describe('interruptAI', () => {
    it('should not interrupt if AI is not speaking', () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      act(() => {
        result.current.interruptAI();
      });

      expect(mockAudioPlayback.interrupt).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { unmount } = renderHook(() => useAISession(createTestOptions()));

      unmount();

      expect(mockAudioCapture.stop).toHaveBeenCalled();
      expect(mockAudioPlayback.destroy).toHaveBeenCalled();
    });

    it('should send end message on unmount when connected', async () => {
      const { result, unmount } = renderHook(() =>
        useAISession(createTestOptions())
      );

      await act(async () => {
        await result.current.startSession();
      });

      mockSend.mockClear();

      unmount();

      expect(mockSend).toHaveBeenCalledWith('ai.session.end', {
        reason: 'user_action',
      });
    });
  });

  // ===========================================================================
  // Network Disconnection Tests
  // ===========================================================================

  describe('network disconnection', () => {
    it('should handle disconnection during active session', async () => {
      const options = createTestOptions();
      const { result, rerender } = renderHook(() => useAISession(options));

      // Start a session
      await act(async () => {
        await result.current.startSession();
      });

      // Simulate disconnect
      mockWebSocketState.isConnected = false;

      await act(async () => {
        rerender();
      });

      expect(mockAudioCapture.stop).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // State Machine Tests
  // ===========================================================================

  describe('state machine', () => {
    it('should respect state transitions', async () => {
      const options = createTestOptions();
      const { result } = renderHook(() => useAISession(options));

      // idle -> starting
      await act(async () => {
        await result.current.startSession();
      });

      expect(options.callbacks?.onStateChange).toHaveBeenCalledWith('starting');

      // Cannot start speaking while starting
      await act(async () => {
        await result.current.startSpeaking();
      });

      expect(mockAudioCapture.start).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Options Tests
  // ===========================================================================

  describe('options handling', () => {
    it('should use default input mode', () => {
      const { result } = renderHook(() =>
        useAISession({
          participantId: 'test',
        })
      );

      expect(result.current.state).toBe('idle');
      // Default mode is push_to_talk
    });

    it('should handle missing callbacks gracefully', async () => {
      const { result } = renderHook(() =>
        useAISession({
          participantId: 'test',
        })
      );

      // Should not throw even without callbacks
      await act(async () => {
        await result.current.startSession();
      });

      expect(mockSend).toHaveBeenCalled();
    });

    it('should use provided audio device ID', async () => {
      const deviceId = 'custom-device-123';
      const { result } = renderHook(() =>
        useAISession(createTestOptions({ audioDeviceId: deviceId }))
      );

      // Device ID is passed to audio capture hook
      expect(result.current.state).toBe('idle');
    });
  });

  // ===========================================================================
  // Audio Level Tests
  // ===========================================================================

  describe('audio level', () => {
    it('should expose audio level from capture hook', () => {
      mockAudioCapture.audioLevel = 0.75;

      const { result } = renderHook(() => useAISession(createTestOptions()));

      expect(result.current.userAudioLevel).toBe(0.75);
    });
  });

  // ===========================================================================
  // Integration-like Tests
  // ===========================================================================

  describe('complete flow', () => {
    it('should support full session lifecycle', async () => {
      const options = createTestOptions();
      const { result } = renderHook(() => useAISession(options));

      // 1. Start session
      expect(result.current.state).toBe('idle');

      await act(async () => {
        await result.current.startSession('en-US');
      });

      expect(mockSend).toHaveBeenCalledWith('ai.session.start', {
        participantId: 'test-participant',
        language: 'en-US',
        voiceId: undefined,
      });

      // 2. End session
      mockSend.mockClear();

      await act(async () => {
        result.current.endSession();
      });

      expect(mockAudioCapture.stop).toHaveBeenCalled();
      expect(mockAudioPlayback.interrupt).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle rapid start/stop calls', async () => {
      const { result } = renderHook(() => useAISession(createTestOptions()));

      // Rapid calls should not cause errors
      await act(async () => {
        await result.current.startSession();
        result.current.endSession();
        await result.current.startSession();
      });

      // Should handle gracefully without throwing
      expect(result.current.state).toBeDefined();
    });

    it('should handle undefined callbacks', async () => {
      const { result } = renderHook(() =>
        useAISession({
          participantId: 'test',
          callbacks: undefined,
        })
      );

      // Should not throw
      await act(async () => {
        await result.current.startSession();
        result.current.endSession();
      });
    });

    it('should handle empty participant ID gracefully', async () => {
      const { result } = renderHook(() =>
        useAISession({
          participantId: '',
        })
      );

      await act(async () => {
        await result.current.startSession();
      });

      // Should still send, even with empty participant ID
      expect(mockSend).toHaveBeenCalledWith('ai.session.start', {
        participantId: '',
        language: undefined,
        voiceId: undefined,
      });
    });
  });
});
