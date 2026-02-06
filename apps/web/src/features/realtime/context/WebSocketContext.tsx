/**
 * WebSocket Context
 *
 * Provides WebSocket service access throughout the React tree.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type {
  WebSocketConnectionState,
  ServerMessagePayloads,
  ClientMessagePayloads,
  MessageHandler,
  ExtendedClientMessageType,
} from '../types/messages';
import {
  createWebSocketService,
  destroyWebSocketService,
  type WebSocketService,
  type WebSocketConfig,
} from '../services/websocket.service';

// =============================================================================
// Context Types
// =============================================================================

export interface WebSocketContextValue {
  /** Current connection state */
  connectionState: WebSocketConnectionState;

  /** Whether the socket is connected */
  isConnected: boolean;

  /** Whether the socket is connecting */
  isConnecting: boolean;

  /** Whether the socket is reconnecting */
  isReconnecting: boolean;

  /** Connect to the WebSocket server */
  connect: (config: Omit<WebSocketConfig, 'onStateChange' | 'onError' | 'onDisconnect'>) => Promise<void>;

  /** Disconnect from the WebSocket server */
  disconnect: () => void;

  /** Send a typed message */
  send: <T extends ExtendedClientMessageType>(
    type: T,
    payload: ClientMessagePayloads[T]
  ) => Promise<void>;

  /** Subscribe to a message type */
  subscribe: <T extends keyof ServerMessagePayloads>(
    type: T,
    handler: MessageHandler<T>
  ) => () => void;

  /** Last connection error */
  error: Error | null;

  /** Last disconnect reason (for unexpected disconnects) */
  disconnectReason: string | null;

  /**
   * Mark session as joined (enables resume on reconnection).
   * Call after receiving session.snapshot to enable state recovery.
   */
  markSessionJoined: (connectionId?: string) => void;

  /**
   * Reset session state (disables resume).
   * Call when leaving a session or when session ends.
   */
  resetSessionState: () => void;

  /** Check if there's an active session that can be resumed */
  hasActiveSession: boolean;

  /** Current reconnect attempt (0 if not reconnecting) */
  reconnectAttempt: number;

  /** Maximum reconnect attempts configured */
  maxReconnectAttempts: number;

  /** Whether all retries have been exhausted */
  retriesExhausted: boolean;

  /** Manually trigger reconnection (resets attempt counter) */
  manualReconnect: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [connectionState, setConnectionState] =
    useState<WebSocketConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [disconnectReason, setDisconnectReason] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Retry state tracking
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [retriesExhausted, setRetriesExhausted] = useState(false);
  const maxReconnectAttempts = 5; // Matches DEFAULT_CONFIG in websocket.service.ts

  // Ref to hold current service instance - enables stable callbacks
  // Callbacks read from this ref instead of closing over `service` state
  const serviceRef = useRef<WebSocketService | null>(null);

  // Track mounted state to prevent state updates after unmount.
  // WebSocket cleanup is handled by the connect-effect cleanup in SessionRoomPage
  // and by the explicit disconnect() callback — not here.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connect = useCallback(
    async (config: Omit<WebSocketConfig, 'onStateChange' | 'onError' | 'onDisconnect' | 'onReconnectAttempt' | 'onRetriesExhausted'>) => {
      // Reset retry state on new connection
      if (mountedRef.current) {
        setReconnectAttempt(0);
        setRetriesExhausted(false);
      }

      // Create new service with callbacks that check mounted state
      const ws = createWebSocketService({
        ...config,
        onStateChange: (state) => {
          if (mountedRef.current) {
            setConnectionState(state);
            // Reset retry state when connected successfully
            if (state === 'connected') {
              setReconnectAttempt(0);
              setRetriesExhausted(false);
            }
          }
        },
        onError: (err) => {
          if (mountedRef.current) {
            setError(err);
          }
        },
        onDisconnect: (reason) => {
          if (mountedRef.current) {
            setDisconnectReason(reason);
          }
        },
        onReconnectAttempt: (attempt) => {
          if (mountedRef.current) {
            setReconnectAttempt(attempt);
          }
        },
        onRetriesExhausted: () => {
          if (mountedRef.current) {
            setRetriesExhausted(true);
          }
        },
      });

      // Set serviceRef immediately so child effects can read it in the same render cycle.
      // Parent useEffect runs after child effects, so a useEffect-based sync would be too late.
      serviceRef.current = ws;

      if (mountedRef.current) {
        setError(null);
        setDisconnectReason(null);
      }

      await ws.connect();
    },
    []
  );

  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
    serviceRef.current = null;
    destroyWebSocketService();
    if (mountedRef.current) {
      setConnectionState('disconnected');
    }
  }, []); // Empty deps - callback is now stable

  const send = useCallback(
    async <T extends ExtendedClientMessageType>(
      type: T,
      payload: ClientMessagePayloads[T]
    ) => {
      if (!serviceRef.current) {
        throw new Error('WebSocket not initialized');
      }
      return serviceRef.current.send(type, payload);
    },
    [] // Empty deps - callback is now stable
  );

  const subscribe = useCallback(
    <T extends keyof ServerMessagePayloads>(
      type: T,
      handler: MessageHandler<T>
    ) => {
      if (!serviceRef.current) {
        // Return no-op unsubscribe if not connected
        return () => {};
      }
      return serviceRef.current.subscribe(type, handler);
    },
    // Re-create when connectionState changes so useSubscription effects re-run
    // and re-register handlers with the current service instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [connectionState]
  );

  const markSessionJoined = useCallback(
    (connectionId?: string) => {
      serviceRef.current?.markSessionJoined(connectionId);
      if (mountedRef.current) {
        setHasActiveSession(true);
      }
    },
    [] // Empty deps - callback is now stable
  );

  const resetSessionState = useCallback(() => {
    serviceRef.current?.resetSessionState();
    if (mountedRef.current) {
      setHasActiveSession(false);
    }
  }, []); // Empty deps - callback is now stable

  const manualReconnect = useCallback(async () => {
    if (mountedRef.current) {
      setReconnectAttempt(0);
      setRetriesExhausted(false);
    }
    await serviceRef.current?.manualReconnect();
  }, []); // Empty deps - callback is now stable

  const value = useMemo<WebSocketContextValue>(
    () => ({
      connectionState,
      isConnected: connectionState === 'connected',
      isConnecting: connectionState === 'connecting',
      isReconnecting: connectionState === 'reconnecting',
      connect,
      disconnect,
      send,
      subscribe,
      error,
      disconnectReason,
      markSessionJoined,
      resetSessionState,
      hasActiveSession,
      reconnectAttempt,
      maxReconnectAttempts,
      retriesExhausted,
      manualReconnect,
    }),
    [connectionState, connect, disconnect, send, subscribe, error, disconnectReason, markSessionJoined, resetSessionState, hasActiveSession, reconnectAttempt, retriesExhausted, manualReconnect]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access the WebSocket context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
