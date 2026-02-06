/**
 * WebSocket Mock
 *
 * Mock WebSocket implementation for testing real-time functionality.
 */

// vitest types used for mocking

// =============================================================================
// Types
// =============================================================================

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  v?: number;
  ts?: string | number;
  clientSeq?: number;
  // Server message fields
  serverSeq?: number;
  id?: string;
  sessionId?: string;
  lastServerSeq?: number;
}

export type MessageHandler = (event: MessageEvent) => void;
export type EventHandler = (event: Event) => void;
export type CloseHandler = (event: CloseEvent) => void;
export type ErrorHandler = (event: Event) => void;

// =============================================================================
// Mock WebSocket Class
// =============================================================================

export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readonly url: string;
  readyState: number = MockWebSocket.CONNECTING;
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  binaryType: BinaryType = 'blob';

  onopen: EventHandler | null = null;
  onmessage: MessageHandler | null = null;
  onclose: CloseHandler | null = null;
  onerror: ErrorHandler | null = null;

  private _sentMessages: WebSocketMessage[] = [];
  private _listeners: Map<string, Set<EventListener>> = new Map();

  // Store protocols for reference but don't auto-set protocol
  // Real WebSocket only has protocol set after server handshake acceptance
  readonly requestedProtocols: string[];

  constructor(url: string | URL, protocols?: string | string[]) {
    this.url = typeof url === 'string' ? url : url.toString();
    // Store requested protocols but don't set this.protocol
    // Protocol is only set when server accepts via setAcceptedProtocol()
    this.requestedProtocols = protocols
      ? Array.isArray(protocols)
        ? protocols
        : [protocols]
      : [];
  }

  /**
   * Simulate server accepting a subprotocol.
   * Call this before simulateOpen() to test subprotocol auth.
   */
  setAcceptedProtocol(protocol: string): void {
    this.protocol = protocol;
  }

  /**
   * Send a message through the WebSocket.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data) as WebSocketMessage;
        this._sentMessages.push(parsed);
      } catch {
        this._sentMessages.push({ type: 'raw', payload: data });
      }
    }
  }

  /**
   * Close the WebSocket connection.
   */
  close(code?: number, reason?: string): void {
    if (this.readyState === MockWebSocket.CLOSED) return;

    this.readyState = MockWebSocket.CLOSING;

    // Simulate async close
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const event = new CloseEvent('close', {
        code: code ?? 1000,
        reason: reason ?? '',
        wasClean: true,
      });
      this.onclose?.(event);
      this._dispatchEvent('close', event);
    }, 0);
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this._dispatchEvent(event.type, event);
  }

  private _dispatchEvent(type: string, event: Event): boolean {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
    return true;
  }

  // =========================================================================
  // Test Helpers
  // =========================================================================

  /**
   * Simulate the connection opening.
   */
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    const event = new Event('open');
    this.onopen?.(event);
    this._dispatchEvent('open', event);
  }

  /**
   * Simulate receiving a message from the server.
   */
  simulateMessage(data: WebSocketMessage | string): void {
    const messageData = typeof data === 'string' ? data : JSON.stringify(data);
    const event = new MessageEvent('message', { data: messageData });
    this.onmessage?.(event);
    this._dispatchEvent('message', event);
  }

  /**
   * Simulate a connection error.
   */
  simulateError(message?: string): void {
    const event = new ErrorEvent('error', { message: message ?? 'Connection error' });
    this.onerror?.(event);
    this._dispatchEvent('error', event);
  }

  /**
   * Simulate connection close from server.
   */
  simulateClose(code: number = 1000, reason: string = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    const event = new CloseEvent('close', {
      code,
      reason,
      wasClean: code === 1000,
    });
    this.onclose?.(event);
    this._dispatchEvent('close', event);
  }

  /**
   * Simulate successful authentication response.
   * Used with first-message auth pattern.
   */
  simulateAuthSuccess(expiresAt?: string): void {
    this.simulateMessage({
      v: 1,
      id: 'auth-success-' + Date.now(),
      ts: new Date().toISOString(),
      type: 'auth.success',
      serverSeq: 0,
      payload: {
        expiresAt: expiresAt ?? new Date(Date.now() + 300000).toISOString(),
      },
    });
  }

  /**
   * Simulate authentication failure response.
   */
  simulateAuthError(code: string = 'AUTH_FAILED', message: string = 'Authentication failed'): void {
    this.simulateMessage({
      v: 1,
      id: 'auth-error-' + Date.now(),
      ts: new Date().toISOString(),
      type: 'auth.error',
      serverSeq: 0,
      payload: {
        code,
        message,
      },
    });
  }

  /**
   * Get all sent messages.
   */
  getSentMessages(): WebSocketMessage[] {
    return [...this._sentMessages];
  }

  /**
   * Get the last sent message.
   */
  getLastSentMessage(): WebSocketMessage | undefined {
    return this._sentMessages[this._sentMessages.length - 1];
  }

  /**
   * Get sent messages of a specific type.
   */
  getSentMessagesOfType(type: string): WebSocketMessage[] {
    return this._sentMessages.filter((m) => m.type === type);
  }

  /**
   * Clear sent messages.
   */
  clearSentMessages(): void {
    this._sentMessages = [];
  }

  /**
   * Check if a message of a specific type was sent.
   */
  wasSent(type: string): boolean {
    return this._sentMessages.some((m) => m.type === type);
  }
}

// =============================================================================
// Mock Factory
// =============================================================================

let mockInstance: MockWebSocket | null = null;

function setMockInstance(instance: MockWebSocket): void {
  mockInstance = instance;
}

/**
 * Create a mock WebSocket constructor that captures instances.
 */
export function createMockWebSocketConstructor(): typeof MockWebSocket {
  return class extends MockWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      setMockInstance(this);
    }
  };
}

/**
 * Get the last created MockWebSocket instance.
 */
export function getMockWebSocketInstance(): MockWebSocket | null {
  return mockInstance;
}

/**
 * Reset the mock WebSocket state.
 */
export function resetMockWebSocket(): void {
  mockInstance = null;
}

// =============================================================================
// Installation Helper
// =============================================================================

/**
 * Install the mock WebSocket globally.
 * Call in beforeEach and cleanup in afterEach.
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   installMockWebSocket();
 * });
 *
 * afterEach(() => {
 *   uninstallMockWebSocket();
 * });
 * ```
 */
let originalWebSocket: typeof WebSocket | undefined;

export function installMockWebSocket(): void {
  originalWebSocket = globalThis.WebSocket;
  (globalThis as unknown as { WebSocket: typeof MockWebSocket }).WebSocket =
    createMockWebSocketConstructor();
}

export function uninstallMockWebSocket(): void {
  if (originalWebSocket) {
    (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket =
      originalWebSocket;
    originalWebSocket = undefined;
  }
  resetMockWebSocket();
}

// =============================================================================
// Message Helpers
// =============================================================================

/**
 * Create a typed WebSocket message.
 */
export function createWsMessage<T extends string>(
  type: T,
  payload?: unknown
): WebSocketMessage {
  return {
    type,
    payload,
    v: 1,
    ts: Date.now(),
  };
}

/**
 * Create common session messages.
 */
export const sessionMessages = {
  joined: (participantId: string, displayName: string) =>
    createWsMessage('session.participant.joined', {
      participantId,
      displayName,
      joinedAt: new Date().toISOString(),
    }),

  left: (participantId: string, reason?: string) =>
    createWsMessage('session.participant.left', {
      participantId,
      reason,
      leftAt: new Date().toISOString(),
    }),

  statusChanged: (status: string) =>
    createWsMessage('session.status.changed', { status }),

  mediaStateChanged: (
    participantId: string,
    mediaState: { audioEnabled?: boolean; videoEnabled?: boolean }
  ) =>
    createWsMessage('session.participant.mediaStateChanged', {
      participantId,
      ...mediaState,
    }),
};
