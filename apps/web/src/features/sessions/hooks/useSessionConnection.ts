/**
 * useSessionConnection Hook
 *
 * Manages WebSocket connection lifecycle for the session room.
 * Handles connect/disconnect, error debouncing, and session.join message.
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface UseSessionConnectionOptions {
  /** Current session ID */
  sessionId: string;
}

// =============================================================================
// Hook
// =============================================================================

export function useSessionConnection({ sessionId }: UseSessionConnectionOptions): void {
  const hasJoinedRef = useRef(false);

  // WebSocket connection
  const {
    connect,
    disconnect,
    connectionState,
    send,
    error: connectionError,
  } = useWebSocket();

  // Session store selectors
  const realtimeToken = useSessionStore((state) => state.realtimeToken);
  const wsEndpoint = useSessionStore((state) => state.wsEndpoint);
  const displayName = useSessionStore((state) => state.displayName);
  const joinRoleId = useSessionStore((state) => state.roleId);

  // Refs for error debouncing
  const connectionStateRef = useRef(connectionState);
  const connectionErrorRef = useRef(connectionError);
  const connectErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastConnectErrorRef = useRef<string | null>(null);

  // ===========================================================================
  // WebSocket Connection Lifecycle
  // ===========================================================================

  useEffect(() => {
    if (realtimeToken && sessionId) {
      const wsUrl = wsEndpoint || import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

      connect({
        url: wsUrl,
        token: realtimeToken,
        sessionId,
      }).catch((err) => {
        logger.error('WebSocket connect failed', { error: String(err) });
      });

      return () => {
        disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeToken, wsEndpoint, sessionId]);

  // ===========================================================================
  // Error Debouncing (prevent duplicate toasts)
  // ===========================================================================

  useEffect(() => {
    connectionStateRef.current = connectionState;
    connectionErrorRef.current = connectionError;
  }, [connectionState, connectionError]);

  useEffect(() => {
    if (!connectionError || connectionState !== 'disconnected') {
      if (connectErrorTimeoutRef.current) {
        clearTimeout(connectErrorTimeoutRef.current);
        connectErrorTimeoutRef.current = null;
      }
      if (connectionState === 'connected') {
        lastConnectErrorRef.current = null;
      }
      return;
    }

    const message = connectionError.message || 'Failed to connect to session';
    if (lastConnectErrorRef.current === message) {
      return;
    }

    if (connectErrorTimeoutRef.current) {
      clearTimeout(connectErrorTimeoutRef.current);
    }

    connectErrorTimeoutRef.current = setTimeout(() => {
      if (
        connectionStateRef.current === 'disconnected' &&
        connectionErrorRef.current?.message === connectionError.message
      ) {
        lastConnectErrorRef.current = message;
        toast.error(message);
      }
    }, 800);

    return () => {
      if (connectErrorTimeoutRef.current) {
        clearTimeout(connectErrorTimeoutRef.current);
        connectErrorTimeoutRef.current = null;
      }
    };
  }, [connectionError, connectionState]);

  // ===========================================================================
  // Session Join Message
  // ===========================================================================

  useEffect(() => {
    if (connectionState === 'connected' && displayName && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      send('session.join', {
        roleId: joinRoleId ?? '',
        displayName,
        deviceInfo: {
          type: 'desktop',
          browser: navigator.userAgent.includes('Chrome')
            ? 'Chrome'
            : navigator.userAgent.includes('Firefox')
              ? 'Firefox'
              : navigator.userAgent.includes('Safari')
                ? 'Safari'
                : 'Unknown',
          os: navigator.platform,
        },
      }).catch((err) => {
        logger.error('Failed to send session.join, will retry', { error: String(err) });
        hasJoinedRef.current = false;
      });
    }
  }, [connectionState, displayName, send, joinRoleId]);
}
