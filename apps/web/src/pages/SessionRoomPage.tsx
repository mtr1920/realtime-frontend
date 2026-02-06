/**
 * Session Room Page
 *
 * Entry point for the session room with providers and access control.
 * Delegates main functionality to SessionRoomContent.
 */

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useAuthHydrated } from '@/shared/stores/auth.store';
import { WebSocketProvider } from '@/features/realtime';
import { WebRTCProvider, type WebRTCConfig } from '@/features/media';
import { useSessionStore } from '@/shared/stores/session.store';
import { SessionRoomContent } from '@/features/sessions/components/room/SessionRoomContent';
import { SessionLoadingSkeleton } from '@/features/sessions';

export function SessionRoomPage() {
  const { sessionId } = useParams({ strict: false }) as { sessionId: string };
  const navigate = useNavigate();

  // Auth state - only need hydration status for loading state
  const isAuthHydrated = useAuthHydrated();

  // Session credentials from join flow
  const realtimeToken = useSessionStore((state) => state.realtimeToken);
  const wsEndpoint = useSessionStore((state) => state.wsEndpoint);
  const displayName = useSessionStore((state) => state.displayName);
  const iceServers = useSessionStore((state) => state.iceServers);

  // Build WebRTC config with TURN servers from backend (falls back to default STUN)
  const webrtcConfig = useMemo<WebRTCConfig | undefined>(() => {
    if (!iceServers?.length) return undefined;
    return { iceServers };
  }, [iceServers]);

  // Determine access - memoized to avoid recalculating on every render
  const hasSessionCredentials = useMemo(
    () => !!realtimeToken && !!wsEndpoint && !!displayName,
    [realtimeToken, wsEndpoint, displayName]
  );
  const canAccess = useMemo(() => hasSessionCredentials, [hasSessionCredentials]);

  // Handle access validation after hydration
  useEffect(() => {
    if (!isAuthHydrated) return;

    if (!canAccess) {
      // No valid access - redirect to lobby to start join flow
      navigate({
        to: '/sessions/$sessionId/lobby',
        params: { sessionId },
        search: { token: undefined, roleId: undefined, code: undefined },
      });
    }
  }, [isAuthHydrated, canAccess, sessionId, navigate]);

  // Show loading skeleton while checking access
  if (!isAuthHydrated) {
    return <SessionLoadingSkeleton className="min-h-screen" />;
  }

  // Prevent rendering if no access (redirect in progress)
  if (!canAccess) {
    return null;
  }

  return (
    <WebSocketProvider>
      <WebRTCProvider config={webrtcConfig}>
        <SessionRoomContent />
      </WebRTCProvider>
    </WebSocketProvider>
  );
}
