# WebSocket Client

## Overview

The frontend uses a typed WebSocket client implementing the signaling protocol with message envelopes, automatic reconnection, heartbeat, and message queuing.

## Message Envelope Format

### Client → Server

```typescript
interface ClientMessage<T = unknown> {
  v: 1;                    // Protocol version
  type: string;            // e.g., "session.join"
  id: string;              // Unique ID (idempotency)
  sessionId: string;
  clientSeq: number;       // Client sequence number
  lastServerSeq: number;   // Last seen server seq (for resume)
  ts: string;              // ISO timestamp
  payload: T;
}
```

### Server → Client

```typescript
interface ServerMessage<T = unknown> {
  v: 1;
  type: string;
  id: string;
  serverSeq: number;       // Monotonic per session
  ts: string;
  payload: T;
  ack?: {
    id: string;            // Acknowledges client message
    status: 'ok' | 'error';
    error?: { code: string; message: string };
  };
}
```

## WebSocketService

```typescript
// shared/services/websocket.service.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private clientSeq = 0;
  private lastServerSeq = 0;
  private messageQueue: ClientMessage[] = [];

  // Connect with token and session ID
  connect(url: string, token: string, sessionId: string): Promise<void>;

  // Request-response pattern (awaits server ack)
  send<T, R>(type: string, payload: T): Promise<ServerMessage<R>>;

  // Fire-and-forget (no ack expected)
  emit<T>(type: string, payload: T): void;

  // Subscribe to message types
  subscribe<T>(type: string, handler: (msg: ServerMessage<T>) => void): () => void;

  // Close connection
  disconnect(): void;
}
```

## Connection States

```typescript
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
```

## Reconnection Strategy

Exponential backoff with jitter:

```
Attempt 1: 100ms + random(0-1000ms)
Attempt 2: 200ms + random(0-1000ms)
Attempt 3: 400ms + random(0-1000ms)
...
Max: 30000ms
Max attempts: 10
```

On reconnect, the client:
1. Reconnects to WebSocket
2. Sends `session.resume` with `lastServerSeq`
3. Server replies with snapshot + missed events
4. Client replays missed events in order

## Heartbeat

- Interval: 30 seconds
- Timeout: 10 seconds (close connection if no pong)

```typescript
// Client sends ping
{ type: 'ping', ts: '2026-01-28T...' }

// Server responds with pong
{ type: 'pong', ts: '2026-01-28T...' }
```

## React Hook Integration

```typescript
// hooks/useWebSocket.ts
function useWebSocket(options: WebSocketOptions) {
  const wsRef = useRef<WebSocketService | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    if (!options.enabled) return;

    const ws = new WebSocketService({
      url: options.url,
      token: options.token,
      sessionId: options.sessionId,
      onStateChange: setConnectionState,
    });

    wsRef.current = ws;
    ws.connect();

    return () => ws.disconnect();
  }, [options.url, options.token, options.sessionId, options.enabled]);

  const send = useCallback((type, payload) =>
    wsRef.current?.send(type, payload)
  , []);

  const emit = useCallback((type, payload) =>
    wsRef.current?.emit(type, payload)
  , []);

  const subscribe = useCallback((type, handler) =>
    wsRef.current?.subscribe(type, handler) ?? (() => {})
  , []);

  return { send, emit, subscribe, connectionState };
}
```

## Message Type Handlers

```typescript
// hooks/useSessionMessages.ts
function useSessionMessages() {
  const { subscribe } = useWebSocket();
  const sessionStore = useSessionStore();

  useEffect(() => {
    const unsubscribers = [
      // Session lifecycle
      subscribe('session.snapshot', (msg) => {
        sessionStore.setSession(msg.payload);
      }),

      subscribe('session.phase.changed', (msg) => {
        sessionStore.setPhase(msg.payload.phase);
      }),

      // Participants
      subscribe('session.participant.joined', (msg) => {
        sessionStore.addParticipant(msg.payload.participant);
      }),

      subscribe('session.participant.left', (msg) => {
        sessionStore.removeParticipant(msg.payload.participantId);
      }),

      // Media state
      subscribe('session.participant.media.changed', (msg) => {
        sessionStore.updateParticipant(msg.payload.participantId, {
          audioEnabled: msg.payload.audioEnabled,
          videoEnabled: msg.payload.videoEnabled,
        });
      }),

      // Errors
      subscribe('error', (msg) => {
        toast.error(msg.payload.message);
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [subscribe, sessionStore]);
}
```

## Common Message Types

### Session

**Joinable Statuses:** Sessions can be joined when status is `CREATED`, `WAITING`, or `ACTIVE`.
- Joining a `CREATED` session auto-transitions it to `WAITING`
- `PAUSED` sessions cannot accept new joins

| Type | Direction | Description |
|------|-----------|-------------|
| `session.join` | C→S | Join session |
| `session.leave` | C→S | Leave session |
| `session.resume` | C→S | Resume after reconnect |
| `session.snapshot` | S→C | Full session state |
| `session.phase.changed` | S→C | Phase transition |
| `session.participant.joined` | S→C | New participant |
| `session.participant.left` | S→C | Participant left |

### AI

| Type | Direction | Description |
|------|-----------|-------------|
| `ai.session.start` | C→S | Start AI session |
| `ai.input.audio.append` | C→S | Send audio chunk |
| `ai.turn.start` | C→S | User starts speaking |
| `ai.turn.end` | C→S | User stops speaking |
| `ai.output.audio.chunk` | S→C | AI audio chunk |
| `ai.output.text.delta` | S→C | Partial text |
| `ai.output.text.complete` | S→C | Complete text |

### Compliance

| Type | Direction | Description |
|------|-----------|-------------|
| `compliance.violation` | C→S | Report violation |
| `compliance.screenshot` | C→S | Send screenshot |
| `compliance.challenge` | S→C | Request verification |

## @realtime/protocol Package

Typed message schemas are in `packages/protocol`:

```typescript
import type { SessionMessage, AIMessage, ComplianceMessage } from '@realtime/protocol';

subscribe<SessionMessage>('session.snapshot', (msg) => {
  // msg.payload is typed
});
```

## Critical Rules

1. **Always use message envelopes** - Never send raw payloads
2. **Track serverSeq** - Essential for reconnection resume
3. **Handle pending messages on disconnect** - Reject with error
4. **Clean up subscriptions** - Prevent memory leaks
5. **Use fire-and-forget for frequent events** - Audio chunks
6. **Use request-response for critical operations** - Join, leave

## Related Documentation

- [WebSocket Client Skill](../../.claude/skills/websocket-client/)
- [Data Flows](../model/data-flows.md)
