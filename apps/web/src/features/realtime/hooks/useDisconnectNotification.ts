/**
 * useDisconnectNotification Hook
 *
 * Shows a toast notification when the WebSocket disconnects unexpectedly.
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useWebSocketContext } from '../context/WebSocketContext';

interface UseDisconnectNotificationOptions {
  /** Whether notifications are enabled */
  enabled?: boolean;
  /** Custom message generator based on disconnect reason */
  getMessage?: (reason: string) => string;
}

/**
 * Default disconnect messages based on reason
 */
function getDefaultMessage(reason: string): string {
  const messages: Record<string, string> = {
    'Connection lost': 'Connection lost. Attempting to reconnect...',
    'Heartbeat timeout': 'Connection timed out. Reconnecting...',
    'Server error': 'Server error occurred. Reconnecting...',
    'Session expired': 'Your session has expired. Please rejoin.',
    'Session ended': 'The session has ended.',
    'Authentication failed': 'Authentication failed. Please rejoin.',
  };

  return messages[reason] || `Connection interrupted: ${reason}`;
}

/**
 * Hook to show toast notifications on WebSocket disconnect.
 * Only shows notifications for unexpected disconnects (not normal closures).
 */
export function useDisconnectNotification(
  options: UseDisconnectNotificationOptions = {}
): void {
  const { enabled = true, getMessage = getDefaultMessage } = options;
  const { connectionState, disconnectReason } = useWebSocketContext();

  // Track if we've shown a notification for this disconnect
  const hasNotifiedRef = useRef(false);

  // Show notification when disconnected with a reason
  useEffect(() => {
    if (!enabled) return;

    // Reset notification flag when reconnecting or connected
    if (connectionState === 'reconnecting' || connectionState === 'connected') {
      hasNotifiedRef.current = false;
    }

    // Show notification if we have a disconnect reason and haven't notified yet
    if (disconnectReason && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;

      const message = getMessage(disconnectReason);

      // Show error for terminal states, warning for recoverable
      if (
        disconnectReason === 'Session expired' ||
        disconnectReason === 'Authentication failed'
      ) {
        toast.error(message);
      } else {
        toast.warning(message);
      }
    }
  }, [connectionState, disconnectReason, enabled, getMessage]);

  // Show success message when reconnected
  useEffect(() => {
    if (!enabled) return;

    // Only show reconnection success if we previously showed a disconnect notification
    if (connectionState === 'connected' && hasNotifiedRef.current) {
      hasNotifiedRef.current = false;
      toast.success('Connection restored');
    }
  }, [connectionState, enabled]);
}
