/**
 * WebSocket Service
 *
 * Core WebSocket client with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat (ping/pong) to detect stale connections
 * - Message queuing during disconnection
 * - Typed message handlers
 * - Race condition protection for connection establishment
 */

import type {
  WebSocketConnectionState,
  TypedClientMessage,
  TypedServerMessage,
  ServerMessagePayloads,
  ClientMessagePayloads,
  MessageHandler,
  MessageHandlerMap,
  ExtendedClientMessageType,
} from '../types/messages';
import { PROTOCOL_VERSION } from '../types/messages';
import { MessageQueue } from './message-queue';
import {
  getCloseCodeMessage,
  NO_RECONNECT_CODES,
  DELAY_RECONNECT_CODES,
  isRecoverableError,
  WS_CLOSE_CODES,
} from '../utils/websocket-errors';
import { WebSocketHeartbeat } from './websocket-heartbeat';
import { WebSocketAuth } from './websocket-auth';
import { WebSocketReconnect } from './websocket-reconnect';

// =============================================================================
// Configuration
// =============================================================================

export interface WebSocketConfig {
  url: string;
  token: string;
  sessionId: string;

  // Reconnection settings
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;

  // Heartbeat settings
  heartbeatInterval?: number;
  heartbeatTimeout?: number;

  // Auth settings
  authTimeout?: number;

  // Token refresh callback (called when token needs refresh)
  onTokenRefreshNeeded?: () => Promise<{ token: string; expiresAt: string } | null>;

  // Callbacks
  onStateChange?: (state: WebSocketConnectionState) => void;
  onError?: (error: Error) => void;
  onDisconnect?: (reason: string) => void;

  /** Called on each reconnection attempt with current attempt and max */
  onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;

  /** Called when all reconnection attempts are exhausted */
  onRetriesExhausted?: () => void;
}

const DEFAULT_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  initialReconnectDelay: 2000, // 2s start (was 1s) - gives network time to stabilize
  maxReconnectDelay: 60000, // 60s max (was 30s) - less aggressive on persistent issues
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000,
  authTimeout: 10000,
};

// =============================================================================
// WebSocket Service Class
// =============================================================================

export class WebSocketService {
  private config: Required<
    Pick<WebSocketConfig, keyof typeof DEFAULT_CONFIG>
  > &
    WebSocketConfig;
  private socket: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = 'disconnected';
  private messageQueue: MessageQueue;
  private handlers: MessageHandlerMap = {};
  private clientSeq = 0;
  private lastServerSeq = 0;
  private pendingMessages: Map<string, {
    resolve: () => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();

  // Extracted modules
  private heartbeat: WebSocketHeartbeat;
  private auth: WebSocketAuth;
  private reconnectManager: WebSocketReconnect;

  // Session state tracking for reconnection with resume
  private hasJoinedSession = false;
  private previousConnectionId: string | null = null;

  // Bound event handlers stored as instance properties to enable proper cleanup
  private boundHandleClose: (event: CloseEvent) => void;
  private boundHandleMessage: (event: MessageEvent) => void;

  // Connection promise for deduplication
  private connectPromise: Promise<void> | null = null;

  constructor(config: WebSocketConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.messageQueue = new MessageQueue();

    // Bind handlers once in constructor for proper event listener cleanup
    this.boundHandleClose = this.handleClose.bind(this);
    this.boundHandleMessage = this.handleMessage.bind(this);

    // Initialize extracted modules
    this.heartbeat = new WebSocketHeartbeat(
      {
        heartbeatInterval: this.config.heartbeatInterval,
        heartbeatTimeout: this.config.heartbeatTimeout,
      },
      {
        sendPing: () => this.sendPingMessage(),
        onTimeout: () => this.socket?.close(WS_CLOSE_CODES.GENERIC_ERROR, 'Heartbeat timeout'),
      }
    );

    this.auth = new WebSocketAuth(
      {
        token: this.config.token,
        sessionId: this.config.sessionId,
        authTimeout: this.config.authTimeout,
        onTokenRefreshNeeded: this.config.onTokenRefreshNeeded,
        onError: this.config.onError,
      },
      {
        getSocket: () => this.socket,
        isConnected: () => this.isConnected(),
        disconnect: () => this.disconnect(),
        getClientSeq: () => this.clientSeq,
        incrementClientSeq: () => ++this.clientSeq,
        getLastServerSeq: () => this.lastServerSeq,
      }
    );

    this.reconnectManager = new WebSocketReconnect(
      {
        reconnect: this.config.reconnect,
        maxReconnectAttempts: this.config.maxReconnectAttempts,
        initialReconnectDelay: this.config.initialReconnectDelay,
        maxReconnectDelay: this.config.maxReconnectDelay,
        onReconnectAttempt: this.config.onReconnectAttempt,
      },
      {
        connect: () => this.connect(),
        setReconnecting: () => this.setConnectionState('reconnecting'),
      }
    );
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /** Current reconnection attempt number (0 if not reconnecting) */
  get reconnectAttempt(): number {
    return this.reconnectManager.reconnectAttempts;
  }

  /** Maximum reconnection attempts configured */
  get maxAttempts(): number {
    return this.reconnectManager.maxAttempts;
  }

  /** Whether all retries have been exhausted */
  get retriesExhausted(): boolean {
    return this.reconnectManager.retriesExhausted;
  }

  /**
   * Dispatch an event to registered handlers.
   * Used for replaying missed events after reconnection.
   */
  dispatchEvent<T extends keyof ServerMessagePayloads>(
    type: T,
    payload: ServerMessagePayloads[T]
  ): void {
    const handlers = this.handlers[type] as Set<MessageHandler<T>> | undefined;
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload, { type, payload } as TypedServerMessage<T>);
        } catch (error) {
          console.error(`Error in handler for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Connect to the WebSocket server.
   * Uses WebSocket subprotocol for token transmission (most secure).
   * Falls back to first-message auth if subprotocol fails.
   *
   * This method is idempotent - duplicate calls while connecting return the same promise.
   */
  async connect(): Promise<void> {
    // Return existing promise if already connecting (deduplication)
    if (this.connectPromise && this.connectionState === 'connecting') {
      return this.connectPromise;
    }

    // Already connected - no-op
    if (this.connectionState === 'connected') {
      return;
    }

    // Start new connection
    this.connectPromise = this.doConnect();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Internal connect implementation
   */
  private async doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setConnectionState('connecting');
      this.auth.setAuthenticated(false);

      try {
        // Build URL WITHOUT token in query params (security improvement)
        const url = new URL(this.config.url);
        url.searchParams.set('sessionId', this.config.sessionId);

        // Encode token for subprotocol transmission
        // Format: realtime.v1.{base64url-encoded-token}
        const encodedToken = this.auth.encodeTokenForSubprotocol(this.auth.getToken());
        const subprotocol = `realtime.v1.${encodedToken}`;

        // Connect with subprotocol for auth
        this.socket = new WebSocket(url.toString(), [subprotocol]);

        const onOpen = () => {
          this.socket?.removeEventListener('error', onError);

          // Check if server accepted our subprotocol (means auth succeeded)
          if (this.socket?.protocol?.startsWith('realtime.v1.')) {
            // Server accepted subprotocol - auth is complete
            this.auth.setAuthenticated(true);
            this.handleOpen();
            resolve();
          } else {
            // Subprotocol not accepted - fall back to first-message auth
            this.auth.sendAuthMessage()
              .then(() => {
                this.handleOpen();
                resolve();
              })
              .catch((error) => {
                this.handleError(error instanceof Error ? error : new Error(String(error)));
                this.disconnect();
                reject(error);
              });
          }
        };

        const onError = (_event: Event) => {
          this.socket?.removeEventListener('open', onOpen);
          const error = new Error('WebSocket connection failed');
          this.handleError(error);
          reject(error);
        };

        this.socket.addEventListener('open', onOpen, { once: true });
        this.socket.addEventListener('error', onError, { once: true });
        this.socket.addEventListener('close', this.boundHandleClose);
        this.socket.addEventListener('message', this.boundHandleMessage);
      } catch (error) {
        this.setConnectionState('disconnected');
        reject(error);
      }
    });
  }

  /**
   * Update the authentication token (for token refresh)
   */
  updateToken(token: string, expiresAt: string): void {
    this.auth.updateToken(token, expiresAt);
  }

  /**
   * Disconnect from the WebSocket server.
   * @param resetSession If true (default), resets session state to prevent resume attempts.
   *                     Set to false if you want to preserve state for manual reconnection.
   */
  disconnect(resetSession = true): void {
    this.cleanup();
    if (this.socket) {
      // Remove event listeners before closing to prevent memory leaks
      this.socket.removeEventListener('close', this.boundHandleClose);
      this.socket.removeEventListener('message', this.boundHandleMessage);
      // Only send close frame if the connection is established.
      // Closing a CONNECTING socket triggers a browser warning
      // ("WebSocket is closed before the connection is established")
      // during React StrictMode double-invoke cycles.
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      }
      this.socket = null;
    }
    this.setConnectionState('disconnected');

    // Reset session state to prevent resume attempts after explicit disconnect
    if (resetSession) {
      this.resetSessionState();
    }
  }

  /**
   * Manually trigger a reconnection attempt.
   * Resets the attempt counter and tries to reconnect.
   */
  async manualReconnect(): Promise<void> {
    this.reconnectManager.resetAttempts();
    this.cleanup();
    await this.connect();
  }

  /**
   * Send a typed message to the server
   */
  async send<T extends ExtendedClientMessageType>(
    type: T,
    payload: ClientMessagePayloads[T]
  ): Promise<void> {
    const message = this.createMessage(type, payload);

    if (
      this.connectionState === 'connected' &&
      this.auth.isAuthenticated &&
      this.socket?.readyState === WebSocket.OPEN
    ) {
      return this.sendMessage(message);
    }

    // Queue message if not connected or not authenticated
    if (this.config.reconnect) {
      this.messageQueue.enqueue(message);
      return Promise.resolve();
    }

    return Promise.reject(new Error('WebSocket not connected or not authenticated'));
  }

  /**
   * Subscribe to a specific message type
   */
  subscribe<T extends keyof ServerMessagePayloads>(
    type: T,
    handler: MessageHandler<T>
  ): () => void {
    if (!this.handlers[type]) {
      // Cast to any to avoid TypeScript's strict generic type checking
      // This is safe because we control the type through the generic T
      (this.handlers as Record<string, Set<MessageHandler<keyof ServerMessagePayloads>>>)[type] = new Set();
    }

    (this.handlers[type] as Set<MessageHandler<T>>).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers[type] as Set<MessageHandler<T>> | undefined;
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          delete this.handlers[type];
        }
      }
    };
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { size: number; oldestAge: number | null } {
    return this.messageQueue.getStats();
  }

  // ===========================================================================
  // Session State Tracking (for reconnection with resume)
  // ===========================================================================

  /**
   * Mark that the session has been successfully joined.
   * Call this after receiving session.snapshot to enable resume on reconnection.
   * @param connectionId Optional connection ID from the server for participant tracking
   */
  markSessionJoined(connectionId?: string): void {
    this.hasJoinedSession = true;
    this.previousConnectionId = connectionId ?? null;
  }

  /**
   * Reset session state.
   * Call this when leaving a session or when the session ends.
   * This prevents resume attempts for a session that no longer exists.
   */
  resetSessionState(): void {
    this.hasJoinedSession = false;
    this.previousConnectionId = null;
    this.lastServerSeq = 0;
  }

  /**
   * Check if the service has an active session that can be resumed.
   */
  hasActiveSession(): boolean {
    return this.hasJoinedSession;
  }

  /**
   * Get the last known server sequence number.
   * Useful for debugging and monitoring reconnection state.
   */
  getLastServerSeq(): number {
    return this.lastServerSeq;
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private setConnectionState(state: WebSocketConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.config.onStateChange?.(state);
    }
  }

  private handleOpen(): void {
    this.setConnectionState('connected');
    this.reconnectManager.resetAttempts();
    this.heartbeat.start();

    // Check if we should resume instead of just replaying messages
    if (this.hasJoinedSession && this.lastServerSeq > 0) {
      // We were previously joined - send resume to recover state
      this.sendResume().then(() => {
        // After resume, replay any queued messages
        this.replayQueuedMessages();
      }).catch((error) => {
        // Resume failed - the server will handle this by sending a fresh snapshot
        // or error. Continue with message replay.
        console.warn('Session resume failed, continuing with message replay:', error);
        this.replayQueuedMessages();
      });
    } else {
      // First connection or no previous session - just replay queued messages
      this.replayQueuedMessages();
    }
  }

  /**
   * Send session.resume message to recover state after reconnection.
   * This allows the server to replay missed events since lastServerSeq.
   */
  private async sendResume(): Promise<void> {
    const message = this.createMessage('session.resume', {
      lastServerSeq: this.lastServerSeq,
      connectionId: this.previousConnectionId ?? undefined,
    });
    return this.sendMessage(message);
  }

  private handleClose(event: CloseEvent): void {
    this.cleanup();
    this.auth.setAuthenticated(false);

    // Get human-readable reason from centralized close code definitions
    const reason = getCloseCodeMessage(event.code, event.reason);

    // Check if this close code should prevent reconnection
    if (NO_RECONNECT_CODES.has(event.code)) {
      this.setConnectionState('disconnected');
      // Reset session state - no reconnection will happen
      this.resetSessionState();
      if (event.code !== WS_CLOSE_CODES.NORMAL) {
        this.config.onDisconnect?.(reason);
      }
      return;
    }

    // Notify about unexpected disconnection
    this.config.onDisconnect?.(reason);

    // Attempt reconnection with special handling based on close code type
    if (this.reconnectManager.shouldReconnect()) {
      // Keep session state for resume - we're attempting to reconnect
      if (DELAY_RECONNECT_CODES.has(event.code)) {
        // For rate limiting, use maximum delay
        this.reconnectManager.scheduleReconnect(this.config.maxReconnectDelay);
      } else if (isRecoverableError(event.code)) {
        // For recoverable errors and connection loss, use normal backoff
        this.reconnectManager.scheduleReconnect();
      } else {
        // For other unexpected codes, attempt reconnection
        this.reconnectManager.scheduleReconnect();
      }
    } else {
      this.setConnectionState('disconnected');
      // Reset session state - no more reconnection attempts
      this.resetSessionState();
      if (this.reconnectManager.retriesExhausted) {
        this.config.onRetriesExhausted?.();
        this.config.onError?.(new Error('Max reconnection attempts reached'));
      }
    }
  }

  private handleError(error: Error): void {
    this.config.onError?.(error);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as TypedServerMessage<keyof ServerMessagePayloads>;

      // Update sequence number
      if (message.serverSeq !== undefined) {
        this.lastServerSeq = message.serverSeq;
      }

      // Handle pong (heartbeat response)
      if (message.type === 'pong') {
        this.heartbeat.handlePong();
        return;
      }

      // Dispatch to handlers
      this.dispatchMessage(message);
    } catch (error) {
      this.config.onError?.(
        error instanceof Error ? error : new Error('Failed to parse message')
      );
    }
  }

  private dispatchMessage<T extends keyof ServerMessagePayloads>(
    message: TypedServerMessage<T>
  ): void {
    const handlers = this.handlers[message.type] as Set<MessageHandler<T>> | undefined;

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.payload, message);
        } catch (error) {
          console.error(`Error in handler for ${message.type}:`, error);
        }
      });
    }
  }

  private createMessage<T extends ExtendedClientMessageType>(
    type: T,
    payload: ClientMessagePayloads[T]
  ): TypedClientMessage<T> {
    return {
      v: PROTOCOL_VERSION,
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type,
      sessionId: this.config.sessionId,
      clientSeq: ++this.clientSeq,
      lastServerSeq: this.lastServerSeq,
      payload,
    };
  }

  private sendMessage<T extends ExtendedClientMessageType>(
    message: TypedClientMessage<T>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      try {
        this.socket.send(JSON.stringify(message));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private sendPingMessage(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = this.createMessage('ping', {});
    this.socket.send(JSON.stringify(message));
  }

  private replayQueuedMessages(): void {
    const messages = this.messageQueue.drain();

    for (const message of messages) {
      // Update sequence numbers
      message.clientSeq = ++this.clientSeq;
      message.lastServerSeq = this.lastServerSeq;

      this.sendMessage(message).catch(() => {
        // Re-queue failed messages
        this.messageQueue.enqueue(message);
      });
    }
  }

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  private cleanup(): void {
    this.heartbeat.stop();
    this.auth.cleanup();
    this.reconnectManager.cancelReconnect();

    // Reject all pending messages
    this.pendingMessages.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('WebSocket disconnected'));
    });
    this.pendingMessages.clear();
  }
}

// =============================================================================
// Factory Function
// =============================================================================

let instance: WebSocketService | null = null;

/**
 * Create or get the WebSocket service instance.
 *
 * IMPORTANT: This function guards against race conditions where a new instance
 * is requested while an existing instance is still connecting. In such cases,
 * the existing instance is returned to prevent closing in-flight connections.
 */
export function createWebSocketService(
  config: WebSocketConfig
): WebSocketService {
  if (instance) {
    const state = instance.getConnectionState();

    // If currently connecting or reconnecting, return existing instance
    // to avoid closing in-flight connections (race condition fix)
    if (state === 'connecting' || state === 'reconnecting') {
      return instance;
    }

    // Only disconnect if fully connected or disconnected
    instance.disconnect();
  }
  instance = new WebSocketService(config);
  return instance;
}

/**
 * Get the current WebSocket service instance
 */
export function getWebSocketService(): WebSocketService | null {
  return instance;
}

/**
 * Destroy the WebSocket service instance
 */
export function destroyWebSocketService(): void {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
