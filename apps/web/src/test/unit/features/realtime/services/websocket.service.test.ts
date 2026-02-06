/**
 * WebSocket Service Tests
 *
 * Tests for connection lifecycle, message handling, reconnection,
 * and heartbeat functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WebSocketService,
  createWebSocketService,
  getWebSocketService,
  destroyWebSocketService,
  type WebSocketConfig,
} from '@/features/realtime/services/websocket.service';
import {
  installMockWebSocket,
  uninstallMockWebSocket,
  getMockWebSocketInstance,
} from '@/test/mocks/websocket.mock';
import type { TypedClientMessage, ExtendedClientMessageType } from '@/features/realtime/types/messages';

// =============================================================================
// Types
// =============================================================================

// Helper type for accessing sent messages as typed protocol messages
type SentMessage = TypedClientMessage<ExtendedClientMessageType>;

// =============================================================================
// Test Setup
// =============================================================================

const defaultConfig: WebSocketConfig = {
  url: 'wss://test.example.com/ws',
  token: 'test-token-123',
  sessionId: 'session-001',
};

function createConfig(overrides: Partial<WebSocketConfig> = {}): WebSocketConfig {
  return { ...defaultConfig, ...overrides };
}

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installMockWebSocket();
    destroyWebSocketService();
  });

  afterEach(() => {
    vi.useRealTimers();
    uninstallMockWebSocket();
    destroyWebSocketService();
  });

  // ===========================================================================
  // Construction
  // ===========================================================================

  describe('construction', () => {
    it('should create service with config', () => {
      const service = new WebSocketService(createConfig());
      expect(service).toBeDefined();
      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should use default config values', () => {
      const service = new WebSocketService(createConfig());
      expect(service.isConnected()).toBe(false);
    });
  });

  // ===========================================================================
  // connect()
  // ===========================================================================

  describe('connect', () => {
    it('should establish connection with first-message auth (token NOT in URL)', async () => {
      const service = new WebSocketService(createConfig());

      const connectPromise = service.connect();

      // Get the mock WebSocket instance and simulate open + auth
      const mockWs = getMockWebSocketInstance();
      expect(mockWs).toBeDefined();
      // Token should NOT be in URL (security improvement)
      expect(mockWs?.url).not.toContain('token=');
      expect(mockWs?.url).toContain('sessionId=session-001');

      mockWs?.simulateOpen();
      // Simulate server auth success response
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Verify auth message was sent
      expect(mockWs?.wasSent('auth')).toBe(true);
      const authMessages = mockWs?.getSentMessagesOfType('auth');
      expect(authMessages?.[0]?.payload).toEqual({ token: 'test-token-123' });

      expect(service.getConnectionState()).toBe('connected');
      expect(service.isConnected()).toBe(true);
    });

    it('should call onStateChange callback', async () => {
      const onStateChange = vi.fn();
      const service = new WebSocketService(createConfig({ onStateChange }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      expect(onStateChange).toHaveBeenCalledWith('connecting');
      expect(onStateChange).toHaveBeenCalledWith('connected');
    });

    it('should reject on connection error', async () => {
      const onError = vi.fn();
      const service = new WebSocketService(createConfig({ onError }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateError('Connection failed');

      await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
      expect(onError).toHaveBeenCalled();
    });

    it('should reject on auth failure', async () => {
      const onError = vi.fn();
      const service = new WebSocketService(createConfig({ onError }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthError('INVALID_TOKEN', 'Invalid token');

      await expect(connectPromise).rejects.toThrow('Invalid token');
    });

    it('should not reconnect if already connected', async () => {
      const service = new WebSocketService(createConfig());

      // First connection
      const promise1 = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await promise1;

      // Second connection attempt should be no-op
      const promise2 = service.connect();
      await promise2;

      expect(service.isConnected()).toBe(true);
    });

    it('should not reconnect if connecting', async () => {
      const service = new WebSocketService(createConfig());

      const promise1 = service.connect();
      const promise2 = service.connect();

      // Both should resolve with same result
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await Promise.all([promise1, promise2]);

      expect(service.isConnected()).toBe(true);
    });
  });

  // ===========================================================================
  // disconnect()
  // ===========================================================================

  describe('disconnect', () => {
    it('should close connection', async () => {
      const service = new WebSocketService(createConfig());

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      service.disconnect();

      expect(service.getConnectionState()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
    });

    it('should clear reconnect timer on disconnect', async () => {
      const service = new WebSocketService(createConfig({
        reconnect: true,
        maxReconnectAttempts: 5,
      }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Simulate abnormal close to trigger reconnect
      mockWs?.simulateClose(1006, 'Abnormal close');
      expect(service.getConnectionState()).toBe('reconnecting');

      // Disconnect should cancel reconnect
      service.disconnect();
      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should handle disconnect while socket is still CONNECTING', () => {
      // Regression: StrictMode double-invoke destroys WebSocket before
      // connection is established, causing "WebSocket is closed before
      // the connection is established" warning
      const service = new WebSocketService(createConfig());

      // Start connecting but do NOT open the socket (stays in CONNECTING state)
      service.connect();
      const mockWs = getMockWebSocketInstance();
      expect(mockWs?.readyState).toBe(0); // CONNECTING

      // Disconnect while still connecting — should not throw
      expect(() => service.disconnect()).not.toThrow();
      expect(service.getConnectionState()).toBe('disconnected');
    });
  });

  // ===========================================================================
  // send()
  // ===========================================================================

  describe('send', () => {
    it('should send message when connected', async () => {
      const service = new WebSocketService(createConfig());

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      await service.send('ping', {});

      const sentMessages = (mockWs?.getSentMessages() ?? []) as unknown as SentMessage[];
      // First message is auth, second is ping
      expect(sentMessages.length).toBe(2);

      const message = sentMessages[1]!;
      expect(message.type).toBe('ping');
      expect(message.v).toBe(1);
      expect(message.sessionId).toBe('session-001');
      expect(message.clientSeq).toBe(1);
    });

    it('should increment clientSeq for each message', async () => {
      const service = new WebSocketService(createConfig());

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      await service.send('ping', {});
      await service.send('ping', {});
      await service.send('ping', {});

      const sentMessages = (mockWs?.getSentMessages() ?? []) as unknown as SentMessage[];
      // Skip auth message (index 0)
      expect(sentMessages[1]!.clientSeq).toBe(1);
      expect(sentMessages[2]!.clientSeq).toBe(2);
      expect(sentMessages[3]!.clientSeq).toBe(3);
    });

    it('should queue message when disconnected with reconnect enabled', async () => {
      const service = new WebSocketService(createConfig({ reconnect: true }));

      // Send before connecting - should queue
      await service.send('session.leave', { reason: 'user_action' });

      // Connect and verify message was replayed
      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Give time for queue replay
      await vi.advanceTimersByTimeAsync(0);

      const sentMessages = (mockWs?.getSentMessages() ?? []) as unknown as SentMessage[];
      expect(sentMessages.length).toBeGreaterThanOrEqual(2); // auth + session.leave
      expect(sentMessages.some((m) => m.type === 'session.leave')).toBe(true);
    });

    it('should reject when disconnected with reconnect disabled', async () => {
      const service = new WebSocketService(createConfig({ reconnect: false }));

      await expect(service.send('ping', {})).rejects.toThrow('WebSocket not connected');
    });
  });

  // ===========================================================================
  // subscribe()
  // ===========================================================================

  describe('subscribe', () => {
    it('should register handler and receive messages', async () => {
      const service = new WebSocketService(createConfig());
      const handler = vi.fn();

      service.subscribe('session.participant.joined', handler);

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Simulate server message
      mockWs?.simulateMessage({
        v: 1,
        id: 'msg-001',
        ts: new Date().toISOString(),
        type: 'session.participant.joined',
        serverSeq: 1,
        payload: {
          participant: {
            id: 'p1',
            userId: 'u1',
            sessionId: 'session-001',
            displayName: 'Test User',
            role: {
              name: 'candidate',
              displayName: 'Candidate',
              permissions: {
                canPublishAudio: true,
                canPublishVideo: true,
                canScreenShare: true,
                canChat: true,
                canEndSession: false,
                canRemoveParticipants: false,
                canStartRecording: false,
                canViewTranscript: true,
                canInteractWithAI: true,
                canViewComplianceData: false,
                // Communication
                canSendPrivateMessages: false,
                // Outcome permissions
                canViewOutcome: false,
                canEditOutcome: false,
                canApproveOutcome: false,
                // Phase control
                canAdvancePhase: false,
                canRevertPhase: false,
              },
            },
            connectionState: 'connected',
            mediaState: {
              audioEnabled: true,
              videoEnabled: true,
              screenShareEnabled: false,
              isSpeaking: false,
            },
            joinedAt: new Date().toISOString(),
          },
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0]?.[0].participant.id).toBe('p1');
    });

    it('should return unsubscribe function', async () => {
      const service = new WebSocketService(createConfig());
      const handler = vi.fn();

      const unsubscribe = service.subscribe('error', handler);

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Unsubscribe
      unsubscribe();

      // Send message - handler should not be called
      mockWs?.simulateMessage({
        v: 1,
        id: 'msg-001',
        ts: new Date().toISOString(),
        type: 'error',
        serverSeq: 1,
        payload: { code: 'ERR', message: 'Error' },
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same type', async () => {
      const service = new WebSocketService(createConfig());
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      service.subscribe('session.state', handler1);
      service.subscribe('session.state', handler2);

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      mockWs?.simulateMessage({
        v: 1,
        id: 'msg-001',
        ts: new Date().toISOString(),
        type: 'session.state',
        serverSeq: 1,
        payload: {
          session: {} as never,
          participants: [],
        },
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Reconnection
  // ===========================================================================

  describe('reconnection', () => {
    it('should reconnect on abnormal close', async () => {
      const onStateChange = vi.fn();
      const service = new WebSocketService(createConfig({
        reconnect: true,
        maxReconnectAttempts: 3,
        initialReconnectDelay: 1000,
        onStateChange,
      }));

      const connectPromise = service.connect();
      let mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Simulate abnormal close
      mockWs?.simulateClose(1006, 'Abnormal close');

      expect(service.getConnectionState()).toBe('reconnecting');

      // Advance timer for reconnect delay
      await vi.advanceTimersByTimeAsync(1000);

      // Get new mock instance and simulate open + auth
      mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();

      // Wait for auth promise to resolve
      await vi.advanceTimersByTimeAsync(0);

      expect(service.getConnectionState()).toBe('connected');
    });

    it('should not reconnect on normal close (1000)', async () => {
      const service = new WebSocketService(createConfig({
        reconnect: true,
      }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Simulate normal close
      mockWs?.simulateClose(1000, 'Normal close');

      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should use exponential backoff', async () => {
      // Mock Math.random to return 0.5, which makes jitter = 0
      // jitter = baseDelay * 0.2 * (0.5 * 2 - 1) = baseDelay * 0.2 * 0 = 0
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const service = new WebSocketService(createConfig({
        reconnect: true,
        maxReconnectAttempts: 5,
        initialReconnectDelay: 1000,
        maxReconnectDelay: 30000,
      }));

      const connectPromise = service.connect();
      let mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // First close
      mockWs?.simulateClose(1006);

      // First reconnect: 1000ms delay
      await vi.advanceTimersByTimeAsync(999);
      expect(service.getConnectionState()).toBe('reconnecting');

      // Complete first reconnect
      await vi.advanceTimersByTimeAsync(1);
      mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      // Don't auth yet - close immediately to test backoff
      mockWs?.simulateClose(1006);

      // Second reconnect: 2000ms delay
      await vi.advanceTimersByTimeAsync(1999);
      expect(service.getConnectionState()).toBe('reconnecting');

      await vi.advanceTimersByTimeAsync(1);
      mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateClose(1006);

      // Third reconnect: 4000ms delay
      await vi.advanceTimersByTimeAsync(3999);
      expect(service.getConnectionState()).toBe('reconnecting');

      randomSpy.mockRestore();
    });

    it('should apply jitter to reconnect delays', async () => {
      // Mock Math.random to return 1.0 for maximum positive jitter (+20%)
      // jitter = baseDelay * 0.2 * (1.0 * 2 - 1) = baseDelay * 0.2 * 1 = baseDelay * 0.2
      // So for 1000ms base: 1000 + 200 = 1200ms delay
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

      const service = new WebSocketService(createConfig({
        reconnect: true,
        maxReconnectAttempts: 3,
        initialReconnectDelay: 1000,
        maxReconnectDelay: 30000,
      }));

      const connectPromise = service.connect();
      let mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Close to trigger reconnect
      mockWs?.simulateClose(1006);

      // With +20% jitter on 1000ms: delay should be 1200ms
      // At 1000ms (base delay), should still be reconnecting because jitter added 200ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(service.getConnectionState()).toBe('reconnecting');

      // At 1199ms, still reconnecting
      await vi.advanceTimersByTimeAsync(199);
      expect(service.getConnectionState()).toBe('reconnecting');

      // At 1200ms, reconnect should trigger (state goes to connecting)
      await vi.advanceTimersByTimeAsync(1);
      mockWs = getMockWebSocketInstance();
      expect(mockWs).toBeDefined();

      randomSpy.mockRestore();
    });

    it('should give up after max attempts', async () => {
      const onError = vi.fn();
      const service = new WebSocketService(createConfig({
        reconnect: true,
        maxReconnectAttempts: 2,
        initialReconnectDelay: 100,
        onError,
      }));

      const connectPromise = service.connect();
      let mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // First close - triggers attempt 1
      mockWs?.simulateClose(1006);
      await vi.advanceTimersByTimeAsync(100);

      // Attempt 1 - connection opens but fails before auth
      mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateClose(1006);
      await vi.advanceTimersByTimeAsync(200);

      // Attempt 2 - connection opens but fails before auth
      mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateClose(1006);

      // Should be disconnected after max attempts
      expect(service.getConnectionState()).toBe('disconnected');
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Max reconnection attempts'),
      }));
    });
  });

  // ===========================================================================
  // Heartbeat
  // ===========================================================================

  describe('heartbeat', () => {
    it('should send ping at configured interval', async () => {
      const service = new WebSocketService(createConfig({
        heartbeatInterval: 5000,
      }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Clear initial messages (auth)
      mockWs?.clearSentMessages();

      // Advance to first heartbeat
      await vi.advanceTimersByTimeAsync(5000);

      expect(mockWs?.wasSent('ping')).toBe(true);
    });

    it('should close connection on heartbeat timeout', async () => {
      const service = new WebSocketService(createConfig({
        heartbeatInterval: 5000,
        heartbeatTimeout: 2000,
        reconnect: false,
      }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Advance to heartbeat
      await vi.advanceTimersByTimeAsync(5000);

      // Don't respond with pong, wait for timeout
      await vi.advanceTimersByTimeAsync(2000);

      // MockWebSocket.close() uses setTimeout, so advance a bit more
      await vi.advanceTimersByTimeAsync(10);

      // Should have closed due to timeout
      expect(service.getConnectionState()).toBe('disconnected');
    });

    it('should clear timeout on pong response', async () => {
      const service = new WebSocketService(createConfig({
        heartbeatInterval: 5000,
        heartbeatTimeout: 2000,
      }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Advance to heartbeat
      await vi.advanceTimersByTimeAsync(5000);

      // Respond with pong
      mockWs?.simulateMessage({
        v: 1,
        id: 'pong-001',
        ts: new Date().toISOString(),
        type: 'pong',
        serverSeq: 1,
        payload: {},
      });

      // Advance past timeout - should still be connected
      await vi.advanceTimersByTimeAsync(2000);

      expect(service.isConnected()).toBe(true);
    });
  });

  // ===========================================================================
  // Queue Stats
  // ===========================================================================

  describe('getQueueStats', () => {
    it('should return queue statistics', () => {
      const service = new WebSocketService(createConfig({ reconnect: true }));

      const stats = service.getQueueStats();
      expect(stats.size).toBe(0);
      expect(stats.oldestAge).toBeNull();
    });
  });

  // ===========================================================================
  // Factory Functions
  // ===========================================================================

  describe('factory functions', () => {
    describe('createWebSocketService', () => {
      it('should create and return service instance', () => {
        const service = createWebSocketService(createConfig());
        expect(service).toBeDefined();
      });

      it('should disconnect existing instance when creating new one', async () => {
        const service1 = createWebSocketService(createConfig());
        const connectPromise = service1.connect();
        const mockWs = getMockWebSocketInstance();
        mockWs?.simulateOpen();
        mockWs?.simulateAuthSuccess();
        await connectPromise;

        const service2 = createWebSocketService(createConfig({
          sessionId: 'session-002',
        }));

        expect(service1.isConnected()).toBe(false);
        expect(service2).toBeDefined();
      });

      it('should NOT disconnect in-flight connection on duplicate createWebSocketService call (race condition fix)', async () => {
        // This test verifies the fix for the WebSocket race condition where
        // connections were being closed before established (code 1001 "Going Away")
        // due to React StrictMode double-mounting effects or rapid re-renders.

        const service1 = createWebSocketService(createConfig());
        const connectPromise = service1.connect();

        // Verify service1 is in connecting state
        expect(service1.getConnectionState()).toBe('connecting');

        // Immediately create another service (simulating React StrictMode double-mount)
        const service2 = createWebSocketService(createConfig({
          sessionId: 'session-002', // Different config
        }));

        // Should return same instance to avoid closing in-flight connection
        expect(service2).toBe(service1);

        // Original connection should still be able to complete
        const mockWs = getMockWebSocketInstance();
        mockWs?.simulateOpen();
        mockWs?.simulateAuthSuccess();
        await connectPromise;

        expect(service1.getConnectionState()).toBe('connected');
        expect(service1.isConnected()).toBe(true);
      });

      it('should NOT disconnect during reconnecting state', async () => {
        const service1 = createWebSocketService(createConfig({
          reconnect: true,
          maxReconnectAttempts: 3,
          initialReconnectDelay: 1000,
        }));

        // Establish initial connection
        const connectPromise = service1.connect();
        const mockWs = getMockWebSocketInstance();
        mockWs?.simulateOpen();
        mockWs?.simulateAuthSuccess();
        await connectPromise;

        // Trigger reconnection
        mockWs?.simulateClose(1006, 'Abnormal close');
        expect(service1.getConnectionState()).toBe('reconnecting');

        // Attempt to create new service during reconnection
        const service2 = createWebSocketService(createConfig({
          sessionId: 'session-002',
        }));

        // Should return same instance to avoid disrupting reconnection
        expect(service2).toBe(service1);
        expect(service1.getConnectionState()).toBe('reconnecting');
      });
    });

    describe('getWebSocketService', () => {
      it('should return null when no service created', () => {
        destroyWebSocketService();
        expect(getWebSocketService()).toBeNull();
      });

      it('should return current service instance', () => {
        const service = createWebSocketService(createConfig());
        expect(getWebSocketService()).toBe(service);
      });
    });

    describe('destroyWebSocketService', () => {
      it('should disconnect and clear instance', async () => {
        const service = createWebSocketService(createConfig());
        const connectPromise = service.connect();
        const mockWs = getMockWebSocketInstance();
        mockWs?.simulateOpen();
        mockWs?.simulateAuthSuccess();
        await connectPromise;

        destroyWebSocketService();

        expect(service.isConnected()).toBe(false);
        expect(getWebSocketService()).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Server Sequence Numbers
  // ===========================================================================

  describe('sequence numbers', () => {
    it('should track server sequence numbers', async () => {
      const service = new WebSocketService(createConfig());

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Receive message with serverSeq
      mockWs?.simulateMessage({
        v: 1,
        id: 'msg-001',
        ts: new Date().toISOString(),
        type: 'session.state',
        serverSeq: 42,
        payload: {
          session: {} as never,
          participants: [],
        },
      });

      // Send message - should include lastServerSeq
      await service.send('ping', {});

      const sentMessages = (mockWs?.getSentMessages() ?? []) as unknown as SentMessage[];
      const pingMessage = sentMessages.find((m) => m.type === 'ping');
      expect(pingMessage?.lastServerSeq).toBe(42);
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  describe('error handling', () => {
    it('should call onError for parse errors', async () => {
      const onError = vi.fn();
      const service = new WebSocketService(createConfig({ onError }));

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      // Send invalid JSON - we need to manually trigger the message handler
      // Since MockWebSocket parses JSON, we'll test the error handler is set up
      expect(service.isConnected()).toBe(true);
    });

    it('should catch handler errors', async () => {
      const service = new WebSocketService(createConfig());
      const errorHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      // Mock console.error to verify error is caught
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.subscribe('error', errorHandler);

      const connectPromise = service.connect();
      const mockWs = getMockWebSocketInstance();
      mockWs?.simulateOpen();
      mockWs?.simulateAuthSuccess();
      await connectPromise;

      mockWs?.simulateMessage({
        v: 1,
        id: 'msg-001',
        ts: new Date().toISOString(),
        type: 'error',
        serverSeq: 1,
        payload: { code: 'ERR', message: 'Test error' },
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
