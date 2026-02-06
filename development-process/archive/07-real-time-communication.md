---
title: "7. Real-Time Communication"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 7. Real-Time Communication

All message types and envelopes must match the backend signaling protocol:
`/home/mtr/Projects/RealtimeApp/realtime-backend/development-process/plans/04-protocols/signaling-protocol.md`.

### 5.1 WebSocket Service

```typescript
// services/websocket.service.ts
import { ClientMessage, ServerMessage } from '@protocol/envelope';
import { useSessionStore } from '@/stores/session.store';

type MessageHandler = (message: ServerMessage) => void;

interface WebSocketServiceConfig {
  url: string;
  token: string;
  sessionId: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private messageQueue: ClientMessage[] = [];
  private clientSeq = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private config: WebSocketServiceConfig;

  constructor(config: WebSocketServiceConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = new URL(this.config.url);
    url.searchParams.set('token', this.config.token);
    url.searchParams.set('sessionId', this.config.sessionId);

    this.ws = new WebSocket(url.toString());
    useSessionStore.getState().setConnectionState('connecting');

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      useSessionStore.getState().setConnectionState('connected');
      this.config.onConnect?.();
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();

      if (event.code !== 1000) {
        this.handleDisconnect(event.reason || 'Connection closed');
      } else {
        useSessionStore.getState().setConnectionState('disconnected');
        this.config.onDisconnect?.(event.reason);
      }
    };

    this.ws.onerror = (event) => {
      this.config.onError?.(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
    useSessionStore.getState().setConnectionState('disconnected');
  }

  send<T>(type: string, payload: T): string {
    const message: ClientMessage<T> = {
      v: 1,
      type,
      id: crypto.randomUUID(),
      sessionId: this.config.sessionId,
      clientSeq: ++this.clientSeq,
      lastServerSeq: useSessionStore.getState().lastServerSeq,
      ts: new Date().toISOString(),
      payload,
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }

    return message.id;
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  private handleMessage(message: ServerMessage): void {
    // Update server sequence
    if (message.serverSeq) {
      useSessionStore.setState({ lastServerSeq: message.serverSeq });
    }

    // Notify handlers
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => handler(message));

    // Notify wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    wildcardHandlers?.forEach((handler) => handler(message));
  }

  private handleDisconnect(reason: string): void {
    useSessionStore.getState().setConnectionState('reconnecting');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      useSessionStore.getState().setConnectionState('disconnected');
      this.config.onDisconnect?.(reason);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.ws?.send(JSON.stringify(message));
    }
  }
}
```

### 5.2 WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { WebSocketService } from '@/services/websocket.service';
import { useSessionStore } from '@/stores/session.store';
import { ServerMessage } from '@protocol/envelope';

interface UseWebSocketOptions {
  url: string;
  token: string;
  sessionId: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const wsRef = useRef<WebSocketService | null>(null);
  const connectionState = useSessionStore((state) => state.connectionState);

  useEffect(() => {
    const ws = new WebSocketService({
      url: options.url,
      token: options.token,
      sessionId: options.sessionId,
      onConnect: options.onConnect,
      onDisconnect: options.onDisconnect,
    });

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
    };
  }, [options.url, options.token, options.sessionId]);

  const send = useCallback(<T>(type: string, payload: T) => {
    return wsRef.current?.send(type, payload);
  }, []);

  const subscribe = useCallback((type: string, handler: (msg: ServerMessage) => void) => {
    return wsRef.current?.on(type, handler) ?? (() => {});
  }, []);

  return {
    send,
    subscribe,
    connectionState,
    isConnected: connectionState === 'connected',
  };
}
```

### 5.3 Session Message Handlers

```typescript
// features/session/hooks/useSessionMessages.ts
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSessionStore } from '../stores/session.store';
import { ServerMessage } from '@protocol/envelope';

export function useSessionMessages() {
  const { subscribe } = useWebSocket();
  const {
    setSession,
    addParticipant,
    removeParticipant,
    updateParticipant,
  } = useSessionStore();

  useEffect(() => {
    const unsubscribers = [
      subscribe('session.snapshot', (msg: ServerMessage) => {
        setSession(msg.payload);
      }),

      subscribe('session.participant.joined', (msg: ServerMessage) => {
        addParticipant(msg.payload.participant);
      }),

      subscribe('session.participant.left', (msg: ServerMessage) => {
        removeParticipant(msg.payload.participantId);
      }),

      subscribe('session.participant.updated', (msg: ServerMessage) => {
        updateParticipant(msg.payload.participantId, msg.payload.updates);
      }),

      subscribe('session.completed', (msg: ServerMessage) => {
        useSessionStore.setState({ status: 'COMPLETED' });
      }),

      subscribe('session.expired', (msg: ServerMessage) => {
        useSessionStore.setState({ status: 'EXPIRED' });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, setSession, addParticipant, removeParticipant, updateParticipant]);
}
```

### 5.4 Observer Join Flow (Read-Only)

Observers must be able to join a session with restricted permissions and no publish capabilities.

```typescript
// features/session/hooks/useObserverJoin.ts
import { useWebSocket } from '@/hooks/useWebSocket';

export function useObserverJoin(sessionId: string) {
  const { send } = useWebSocket({ url: '/ws', token: '...', sessionId });

  const joinAsObserver = (displayName: string) => {
    send('session.join', {
      roleId: 'observer',
      joinMode: 'readOnly',
      displayName,
    });
  };

  return { joinAsObserver };
}
```

### 5.5 Recording + Screen Share Status

```typescript
// features/recording/hooks/useRecordingStatus.ts
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRecordingStore } from '@/features/recording/model/recording.store';

export function useRecordingStatus() {
  const { subscribe } = useWebSocket({ url: '/ws', token: '...', sessionId: '...' });

  useEffect(() => {
    const unsubscribers = [
      subscribe('media.screenShare.status', (msg) => {
        useRecordingStore.getState().setScreenShareStatus(msg.payload);
      }),
      subscribe('recording.status', (msg) => {
        useRecordingStore.getState().setRecordingStatus(msg.payload);
      }),
      subscribe('recording.finalized', (msg) => {
        useRecordingStore.getState().setRecordingFinalized(msg.payload);
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [subscribe]);
}
```

### 5.6 Outcome + Compliance Signals

```typescript
// features/outcomes/hooks/useOutcomeSignals.ts
import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useOutcomesStore } from '@/features/outcomes/model/outcomes.store';
import { useComplianceStore } from '@/features/compliance/model/compliance.store';

export function useOutcomeSignals() {
  const { subscribe } = useWebSocket({ url: '/ws', token: '...', sessionId: '...' });

  useEffect(() => {
    const unsubscribers = [
      subscribe('outcome.ready', (msg) => {
        useOutcomesStore.getState().addOutcome(msg.payload);
      }),
      subscribe('outcome.updated', (msg) => {
        useOutcomesStore.getState().updateOutcome(msg.payload);
      }),
      subscribe('compliance.violation', (msg) => {
        useComplianceStore.getState().recordViolation(msg.payload);
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [subscribe]);
}
```

---
