---
name: websocket-client
description: Use when implementing WebSocket communication, real-time messaging, or subscription patterns
---

# WebSocket Client Patterns

Real-time communication with typed WebSocket messages.

## Overview

This skill covers the WebSocket service, message envelope format, subscription patterns, reconnection strategies, and heartbeat monitoring.

---

## Message Envelope Format

```typescript
// ✅ CORRECT - Typed message envelopes
// packages/protocol/src/envelope.ts

// Client → Server
interface ClientMessage<T extends ClientMessageType = ClientMessageType> {
  type: T;
  payload: ClientMessagePayloads[T];
  seq: number;      // Client sequence number (for ack)
  timestamp: number;
}

// Server → Client
interface ServerMessage<T extends ServerMessageType = ServerMessageType> {
  type: T;
  payload: ServerMessagePayloads[T];
  seq: number;      // Server sequence number
  ack?: number;     // Acknowledges client seq
  timestamp: number;
}

// Message types
type ClientMessageType =
  | 'chat.message'
  | 'session.join'
  | 'session.leave'
  | 'media.track.enable'
  | 'media.track.disable'
  | 'webrtc.offer'
  | 'webrtc.answer'
  | 'webrtc.ice-candidate'
  | 'heartbeat';

type ServerMessageType =
  | 'chat.message'
  | 'chat.message.confirmed'
  | 'session.participant.joined'
  | 'session.participant.left'
  | 'session.participant.updated'
  | 'session.state.changed'
  | 'webrtc.offer'
  | 'webrtc.answer'
  | 'webrtc.ice-candidate'
  | 'error'
  | 'heartbeat.ack';
```

---

## WebSocket Service

```typescript
// ✅ CORRECT - WebSocket service with reconnection
// features/realtime/services/websocket.service.ts

interface WebSocketConfig {
  url: string;
  token: string;
  sessionId: string;

  // Reconnection
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;

  // Heartbeat
  heartbeatInterval?: number;
  heartbeatTimeout?: number;

  // Callbacks
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: WebSocketError) => void;
  onDisconnect?: (reason: DisconnectReason) => void;
  onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
  onRetriesExhausted?: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers = new Map<string, Set<MessageHandler>>();
  private seq = 0;
  private reconnectAttempts = 0;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnect: true,
      maxReconnectAttempts: 5,
      initialReconnectDelay: 1000,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      heartbeatTimeout: 10000,
      ...config,
    };
  }

  connect(): void {
    const url = new URL(this.config.url);
    url.searchParams.set('token', this.config.token);
    url.searchParams.set('sessionId', this.config.sessionId);

    this.ws = new WebSocket(url.toString());
    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  disconnect(): void {
    this.reconnectAttempts = this.config.maxReconnectAttempts!; // Prevent reconnect
    this.ws?.close(1000, 'Client disconnect');
  }

  send<T extends ClientMessageType>(
    type: T,
    payload: ClientMessagePayloads[T]
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: ClientMessage<T> = {
      type,
      payload,
      seq: ++this.seq,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  subscribe<T extends ServerMessageType>(
    type: T,
    handler: (payload: ServerMessagePayloads[T], message: ServerMessage<T>) => void
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    this.handlers.get(type)!.add(handler as MessageHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler as MessageHandler);
    };
  }

  private handleMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data) as ServerMessage;
    const handlers = this.handlers.get(message.type);

    handlers?.forEach((handler) => {
      try {
        handler(message.payload, message);
      } catch (error) {
        console.error(`Handler error for ${message.type}:`, error);
      }
    });
  }
}
```

---

## Context and Hook Pattern

```typescript
// ✅ CORRECT - WebSocket context
// features/realtime/context/WebSocketContext.tsx

interface WebSocketContextValue {
  isConnected: boolean;
  connectionState: ConnectionState;
  send: <T extends ClientMessageType>(type: T, payload: ClientMessagePayloads[T]) => void;
  subscribe: <T extends ServerMessageType>(
    type: T,
    handler: MessageHandler<T>
  ) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children, sessionId }: Props) {
  const serviceRef = useRef<WebSocketService | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !sessionId) return;

    const service = new WebSocketService({
      url: import.meta.env.VITE_WS_URL,
      token,
      sessionId,
      onStateChange: setConnectionState,
      onRetriesExhausted: () => {
        toast.error('Connection lost. Please refresh the page.');
      },
    });

    serviceRef.current = service;
    service.connect();

    return () => {
      service.disconnect();
      serviceRef.current = null;
    };
  }, [sessionId]);

  const value = useMemo(() => ({
    isConnected: connectionState === 'connected',
    connectionState,
    send: (type, payload) => serviceRef.current?.send(type, payload),
    subscribe: (type, handler) => serviceRef.current?.subscribe(type, handler) ?? (() => {}),
    reconnect: () => serviceRef.current?.connect(),
  }), [connectionState]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
```

---

## Subscription Hook Pattern

```typescript
// ✅ CORRECT - Type-safe subscription hook
// features/realtime/hooks/useSubscription.ts

export function useSubscription<T extends ServerMessageType>(
  type: T,
  handler: (payload: ServerMessagePayloads[T], message: ServerMessage<T>) => void,
  enabled = true
) {
  const { subscribe } = useWebSocket();

  // Keep handler ref to avoid resubscription
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const wrappedHandler = (payload: ServerMessagePayloads[T], message: ServerMessage<T>) => {
      handlerRef.current(payload, message);
    };

    return subscribe(type, wrappedHandler);
  }, [type, subscribe, enabled]);
}

// Usage
useSubscription('session.participant.joined', (payload) => {
  addParticipant(payload.participant);
});

useSubscription('chat.message', (payload) => {
  addMessage(payload.message);
}, isChatEnabled);
```

---

## Send Hook Pattern

```typescript
// ✅ CORRECT - Type-safe send hook
// features/realtime/hooks/useSend.ts

export function useSend() {
  const { send, isConnected } = useWebSocket();

  return useCallback(
    async <T extends ClientMessageType>(
      type: T,
      payload: ClientMessagePayloads[T]
    ) => {
      if (!isConnected) {
        console.warn(`Attempting to send ${type} while disconnected`);
        return;
      }
      send(type, payload);
    },
    [send, isConnected]
  );
}

// Usage
const send = useSend();

const sendChatMessage = useCallback((content: string) => {
  send('chat.message', { content, timestamp: Date.now() });
}, [send]);
```

---

## Reconnection Strategy

```typescript
// ✅ CORRECT - Exponential backoff with jitter
private scheduleReconnect(): void {
  if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
    this.config.onRetriesExhausted?.();
    return;
  }

  this.reconnectAttempts++;

  // Exponential backoff with jitter
  const baseDelay = this.config.initialReconnectDelay!;
  const maxDelay = this.config.maxReconnectDelay!;
  const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
  const jitter = Math.random() * 1000;
  const delay = Math.min(exponentialDelay + jitter, maxDelay);

  this.config.onReconnectAttempt?.(this.reconnectAttempts, this.config.maxReconnectAttempts!);

  setTimeout(() => {
    this.connect();
  }, delay);
}
```

---

## Heartbeat Monitoring

```typescript
// ✅ CORRECT - Heartbeat with timeout detection
private startHeartbeat(): void {
  this.heartbeatTimer = setInterval(() => {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Send heartbeat
    this.send('heartbeat', { timestamp: Date.now() });

    // Set timeout for response
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn('Heartbeat timeout - connection may be stale');
      this.ws?.close(4000, 'Heartbeat timeout');
    }, this.config.heartbeatTimeout!);
  }, this.config.heartbeatInterval!);
}

private handleHeartbeatAck(): void {
  if (this.heartbeatTimeoutTimer) {
    clearTimeout(this.heartbeatTimeoutTimer);
    this.heartbeatTimeoutTimer = null;
  }
}
```

---

## Message Queue for Offline

```typescript
// ✅ CORRECT - Queue messages during disconnection
private messageQueue: QueuedMessage[] = [];

send<T extends ClientMessageType>(type: T, payload: ClientMessagePayloads[T]): void {
  const message: ClientMessage<T> = {
    type,
    payload,
    seq: ++this.seq,
    timestamp: Date.now(),
  };

  if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
    // Queue for later
    this.messageQueue.push(message);
    return;
  }

  this.ws.send(JSON.stringify(message));
}

private flushQueue(): void {
  while (this.messageQueue.length > 0) {
    const message = this.messageQueue.shift()!;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

---

## Connection State UI

```typescript
// ✅ CORRECT - Connection status indicator
function ConnectionStatus() {
  const { connectionState, reconnect } = useWebSocket();

  if (connectionState === 'connected') {
    return null; // Don't show when connected
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert variant="warning">
        {connectionState === 'connecting' && (
          <>
            <Loader2 className="animate-spin" />
            <span>Connecting...</span>
          </>
        )}
        {connectionState === 'disconnected' && (
          <>
            <WifiOff />
            <span>Disconnected</span>
            <Button size="sm" onClick={reconnect}>
              Reconnect
            </Button>
          </>
        )}
        {connectionState === 'reconnecting' && (
          <>
            <Loader2 className="animate-spin" />
            <span>Reconnecting...</span>
          </>
        )}
      </Alert>
    </div>
  );
}
```

---

## Store Integration

```typescript
// ✅ CORRECT - WebSocket updates Zustand store
useSubscription('session.participant.joined', (payload) => {
  useSessionStore.getState().addParticipant(payload.participant);
});

useSubscription('session.participant.left', (payload) => {
  useSessionStore.getState().removeParticipant(payload.participantId);
});

useSubscription('session.state.changed', (payload) => {
  // Invalidate TanStack Query cache
  queryClient.invalidateQueries({
    queryKey: queryKeys.sessions.detail(payload.sessionId),
  });
});
```

---

## Critical Rules

1. **Use typed subscribe/send** - never raw `.on()` callbacks
2. **Return unsubscribe** from subscribe - always cleanup
3. **Use handlerRef** - avoid resubscription on handler change
4. **Exponential backoff** - for reconnection attempts
5. **Heartbeat monitoring** - detect stale connections
6. **Queue messages** - during temporary disconnection
7. **Context provider** - single WebSocket per session
8. **Update stores** - WebSocket feeds Zustand, not TanStack Query

---

## Related Skills

- `zustand-state-management` - Store updates from WebSocket
- `tanstack-query-patterns` - Cache invalidation
- `webrtc-media` - Signaling integration
