/**
 * useWebSocket Hook
 *
 * Provides access to WebSocket functionality with automatic
 * cleanup and subscription management.
 */

import { useEffect, useCallback, useRef } from 'react';
import type {
  ServerMessagePayloads,
  ClientMessagePayloads,
  MessageHandler,
  ExtendedClientMessageType,
} from '../types/messages';
import { useWebSocketContext } from '../context/WebSocketContext';

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook for WebSocket operations
 */
export function useWebSocket() {
  const context = useWebSocketContext();
  return context;
}

// =============================================================================
// Subscription Hook
// =============================================================================

/**
 * Hook to subscribe to a specific message type
 *
 * Automatically handles subscription cleanup on unmount.
 */
export function useSubscription<T extends keyof ServerMessagePayloads>(
  type: T,
  handler: MessageHandler<T>,
  enabled = true
) {
  const { subscribe } = useWebSocketContext();
  const handlerRef = useRef(handler);

  // Keep handler ref updated
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    // Wrap handler to use ref
    const wrappedHandler: MessageHandler<T> = (payload, message) => {
      handlerRef.current(payload, message);
    };

    const unsubscribe = subscribe(type, wrappedHandler);
    return unsubscribe;
  }, [type, subscribe, enabled]);
}

// =============================================================================
// Send Hook
// =============================================================================

/**
 * Hook that provides a stable send function
 */
export function useSend() {
  const { send, isConnected } = useWebSocketContext();

  const safeSend = useCallback(
    async <T extends ExtendedClientMessageType>(
      type: T,
      payload: ClientMessagePayloads[T]
    ) => {
      if (!isConnected) {
        console.warn(`Attempting to send ${type} while disconnected`);
      }
      return send(type, payload);
    },
    [send, isConnected]
  );

  return safeSend;
}

// =============================================================================
// Connection Hook
// =============================================================================

interface UseConnectionOptions {
  url: string;
  token: string;
  sessionId: string;
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to manage WebSocket connection lifecycle
 */
export function useConnection({
  url,
  token,
  sessionId,
  autoConnect = true,
  onConnected,
  onDisconnected,
  onError,
}: UseConnectionOptions) {
  const {
    connect,
    disconnect,
    connectionState,
    isConnected,
    error,
  } = useWebSocketContext();

  // Store callbacks in refs to avoid dependency issues
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onErrorRef.current = onError;
  }, [onConnected, onDisconnected, onError]);

  // Track previous state for callbacks
  const prevConnectedRef = useRef(isConnected);

  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      onConnectedRef.current?.();
    } else if (!isConnected && prevConnectedRef.current) {
      onDisconnectedRef.current?.();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onErrorRef.current?.(error);
    }
  }, [error]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && url && token && sessionId) {
      connect({ url, token, sessionId }).catch(() => {
        // Error will be handled by onError callback
      });

      return () => {
        disconnect();
      };
    }
  }, [autoConnect, url, token, sessionId, connect, disconnect]);

  return {
    connectionState,
    isConnected,
    error,
    connect: useCallback(
      () => connect({ url, token, sessionId }),
      [connect, url, token, sessionId]
    ),
    disconnect,
  };
}

// =============================================================================
// Session Messages Hook
// =============================================================================

interface UseSessionMessagesOptions {
  onParticipantJoined?: MessageHandler<'session.participant.joined'>;
  onParticipantLeft?: MessageHandler<'session.participant.left'>;
  onParticipantUpdated?: MessageHandler<'session.participant.updated'>;
  onSessionState?: MessageHandler<'session.state'>;
  onError?: MessageHandler<'error'>;
  enabled?: boolean;
}

/**
 * Hook to subscribe to common session messages
 */
export function useSessionMessages({
  onParticipantJoined,
  onParticipantLeft,
  onParticipantUpdated,
  onSessionState,
  onError,
  enabled = true,
}: UseSessionMessagesOptions) {
  const { subscribe } = useWebSocketContext();

  // Store handlers in refs
  const handlers = useRef({
    onParticipantJoined,
    onParticipantLeft,
    onParticipantUpdated,
    onSessionState,
    onError,
  });

  useEffect(() => {
    handlers.current = {
      onParticipantJoined,
      onParticipantLeft,
      onParticipantUpdated,
      onSessionState,
      onError,
    };
  }, [onParticipantJoined, onParticipantLeft, onParticipantUpdated, onSessionState, onError]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribers: (() => void)[] = [];

    if (handlers.current.onParticipantJoined) {
      unsubscribers.push(
        subscribe('session.participant.joined', (payload, message) => {
          handlers.current.onParticipantJoined?.(payload, message);
        })
      );
    }

    if (handlers.current.onParticipantLeft) {
      unsubscribers.push(
        subscribe('session.participant.left', (payload, message) => {
          handlers.current.onParticipantLeft?.(payload, message);
        })
      );
    }

    if (handlers.current.onParticipantUpdated) {
      unsubscribers.push(
        subscribe('session.participant.updated', (payload, message) => {
          handlers.current.onParticipantUpdated?.(payload, message);
        })
      );
    }

    if (handlers.current.onSessionState) {
      unsubscribers.push(
        subscribe('session.state', (payload, message) => {
          handlers.current.onSessionState?.(payload, message);
        })
      );
    }

    if (handlers.current.onError) {
      unsubscribers.push(
        subscribe('error', (payload, message) => {
          handlers.current.onError?.(payload, message);
        })
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe, enabled]);
}
