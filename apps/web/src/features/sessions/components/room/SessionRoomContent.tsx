/**
 * Session Room Content
 *
 * Main session room component with real-time video, audio, and collaboration.
 * Handles media initialization and compliance features.
 * WebSocket subscriptions are managed by useSessionSubscriptions hook.
 */

import { useEffect, useCallback, useState, memo } from 'react';
import { useParams, useNavigate, Link, type LinkProps } from '@tanstack/react-router';
import { AlertCircle, Loader2, Mic } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { toast } from 'sonner';
import { useSession, useCompleteSession, useSessionConfig } from '@/features/sessions';
import {
  LazyVideoGridContainer,
  LazyMediaInitializer,
  LazyObserverWebRTCInitializer,
  MediaSuspense,
} from '@/features/sessions/components/room/lazy';
import { logger } from '@/shared/lib/logger';
import { SessionLayout } from '@/features/sessions/components/room/SessionLayout';
import {
  ComplianceOverlay,
  useBrowserLock,
  useIdentityChallenge,
  useInactivityTimer,
  useComplianceCapture,
  IdentityChallenge,
  InactivityWarning,
  useComplianceHistoryStore,
} from '@/features/compliance';
import { useWebSocket, useDisconnectNotification } from '@/features/realtime';
import {
  useScreenShareEnforcement,
  ScreenShareRequired,
  ResharePrompt,
} from '@/features/media';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { Button, Card, CardContent } from '@/shared/ui';
import { useSessionSubscriptions } from '../../hooks/useSessionSubscriptions';
import { useSessionReady } from '../../hooks/useSessionReady';
import { useSessionConnection } from '../../hooks/useSessionConnection';
import { mapApiStatusToProtocol } from '../../utils/sessionRoomHelpers';

// =============================================================================
// Loading & Fallback Components
// =============================================================================

const VideoGridLoading = memo(function VideoGridLoading() {
  return (
    <div
      className="h-full flex items-center justify-center bg-muted/30 rounded-lg"
      role="status"
      aria-label="Loading video grid"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-8 w-8 motion-safe:animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Connecting to session...</p>
      </div>
    </div>
  );
});

const AudioOnlyView = memo(function AudioOnlyView() {
  return (
    <div
      className="h-full flex items-center justify-center bg-muted/30 rounded-lg"
      role="region"
      aria-label="Audio-only session"
    >
      <div className="text-center">
        <Mic
          className="h-12 w-12 text-muted-foreground mx-auto mb-3"
          aria-hidden="true"
        />
        <h3 className="text-lg font-medium mb-1">Audio Session</h3>
        <p className="text-sm text-muted-foreground">This session is audio-only.</p>
      </div>
    </div>
  );
});

// =============================================================================
// Session Room Content
// =============================================================================

export function SessionRoomContent() {
  const { sessionId } = useParams({ strict: false }) as { sessionId: string };
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  // Track media initialization for session.ready
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [mediaInitFailed, setMediaInitFailed] = useState(false);

  // Check if user is authenticated (for conditional HTTP query)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Session store - only selectors needed locally
  const sessionFromStore = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const reset = useSessionStore((state) => state.reset);

  // Compliance history store - for clearing on session end
  const clearComplianceHistory = useComplianceHistoryStore((state) => state.clearHistory);

  // Media store - for cleanup on leave
  const stopAllTracks = useMediaStore((state) => state.stopAllTracks);

  // WebSocket connection lifecycle (extracted to dedicated hook)
  useSessionConnection({ sessionId });

  // WebSocket subscriptions (extracted to dedicated hook)
  const { hasSnapshot } = useSessionSubscriptions({
    sessionId,
  });

  // Fetch session data via HTTP API only if user is authenticated
  const {
    session: sessionFromApi,
    isLoading: isApiLoading,
    isError: isApiError,
    error: apiError,
  } = useSession(sessionId, { enabled: isAuthenticated });

  // Use session from API if available, otherwise fall back to store
  const session = sessionFromApi ?? sessionFromStore;
  const isLoading = isAuthenticated ? isApiLoading : false;
  const isError = isAuthenticated ? isApiError : false;
  const error = isAuthenticated ? apiError : null;

  // Complete session mutation
  const { completeSession, isLoading: isEnding } = useCompleteSession({
    onSuccess: () => {
      toast.success('Session ended');
      clearComplianceHistory();
      navigate({ to: '/sessions' });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to end session');
    },
  });

  // WebSocket connection (for leave/disconnect actions)
  const { disconnect, send, resetSessionState } = useWebSocket();

  // Show toast notifications on WebSocket disconnect/reconnect
  useDisconnectNotification();

  // Session config
  const {
    isComplianceEnabled,
    isBrowserLockRequired,
    isIdentityVerificationRequired,
    isScreenShareRequired,
    requireEntireScreen,
    forceReshareOnStop,
    isModuleEnabled,
    isObserver,
  } = useSessionConfig();

  const hasMediaModule = isModuleEnabled('video') || isModuleEnabled('audio');

  // Session ready announcement (extracted to dedicated hook)
  useSessionReady({
    sessionId,
    hasSnapshot,
    mediaInitialized,
    mediaInitFailed,
    isObserver,
    hasMediaModule,
  });

  // Screen share enforcement
  const {
    isSharing: isScreenSharing,
    isRequired: screenShareIsRequired,
    showResharePrompt,
    permissionDenied: screenSharePermissionDenied,
    error: screenShareError,
    isLoading: screenShareIsLoading,
    requestScreenShare,
    dismissResharePrompt,
    clearError: clearScreenShareError,
  } = useScreenShareEnforcement();

  // Compliance hooks
  useBrowserLock({ enabled: isBrowserLockRequired });

  const {
    activeVerification,
    status: verificationStatus,
    remainingSeconds: verificationRemainingSeconds,
    submitResponse,
  } = useIdentityChallenge({
    enabled: isIdentityVerificationRequired,
    onVerificationReceived: () => toast.info('Identity verification required'),
    onVerificationExpired: () => toast.error('Verification time expired'),
  });

  const {
    isWarningActive: isInactivityWarningActive,
    secondsRemaining: inactivitySecondsRemaining,
    resetTimer: resetInactivityTimer,
  } = useInactivityTimer({
    enabled: isComplianceEnabled,
    warningTimeoutSeconds: 120,
    inactiveTimeoutSeconds: 30,
    onWarning: () => toast.warning('Inactivity detected'),
    onInactive: () => {
      send('compliance.violation', {
        type: 'custom',
        severity: 'medium',
        details: { reason: 'User became inactive' },
        timestamp: new Date().toISOString(),
      });
    },
  });

  useComplianceCapture({
    enabled: isComplianceEnabled,
    intervalSeconds: 60,
    videoSelector: 'video[data-compliance-capture]',
  });

  // Store session data when loaded from API
  useEffect(() => {
    if (sessionFromApi) {
      const protocolSession = {
        id: sessionFromApi.id,
        tenantId: sessionFromApi.tenantId ?? '',
        workspaceId: sessionFromApi.workspaceId,
        status: mapApiStatusToProtocol(sessionFromApi.status),
        title: sessionFromApi.externalId || `Session ${sessionFromApi.id.slice(0, 8)}`,
        scheduledStartTime: sessionFromApi.scheduledAt ?? undefined,
        actualStartTime: sessionFromApi.startedAt ?? undefined,
        endTime: sessionFromApi.endedAt ?? undefined,
        config: {
          domainType: sessionFromApi.domainType || 'default',
          enabledModules: ['chat'],
          recording: {
            enabled:
              (sessionFromApi.metadata as Record<string, boolean> | undefined)?.recording ?? false,
            autoStart: false,
          },
          ai: {
            enabled:
              (sessionFromApi.metadata as Record<string, unknown> | undefined)?.aiEnabled === true,
            provider: (sessionFromApi.metadata as Record<string, unknown> | undefined)
              ?.aiProvider as string | undefined,
          },
          compliance: {
            enabled: false,
            browserLock: false,
            identityVerification: false,
          },
        },
        createdAt: sessionFromApi.createdAt,
        updatedAt: sessionFromApi.updatedAt,
      };
      setSession(protocolSession);
    }
  }, [sessionFromApi, setSession]);

  // Handle leave session
  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await send('session.leave', { reason: 'user_action' });
      resetSessionState();
      disconnect();
      stopAllTracks(); // Stop media tracks before resetting state
      reset();
      clearComplianceHistory();
      navigate({ to: '/sessions' });
    } catch {
      toast.error('Failed to leave session');
    } finally {
      setIsLeaving(false);
    }
  }, [send, resetSessionState, disconnect, stopAllTracks, reset, clearComplianceHistory, navigate]);

  // Handle end session
  const handleEndSession = useCallback(async () => {
    if (sessionId) {
      stopAllTracks(); // Stop media tracks before ending session
      await completeSession(sessionId);
    }
  }, [sessionId, stopAllTracks, completeSession]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isAuthenticated && (isError || !session)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Session</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error?.message || 'The session could not be found or you do not have access.'}
            </p>
            <Button asChild>
              <Link to={'/sessions' as LinkProps['to']}>Go to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthenticated loading state
  if (!isAuthenticated && !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionLayout
        onLeave={handleLeave}
        onEndSession={handleEndSession}
        isLoading={isLeaving || isEnding}
      >
        {hasMediaModule ? (
          <MediaSuspense fallback={<VideoGridLoading />}>
            {isObserver ? (
              // Observers: Initialize WebRTC for receive-only (no media capture)
              <LazyObserverWebRTCInitializer
                onReady={() => {
                  logger.info('Observer WebRTC ready');
                  setMediaInitialized(true);
                }}
              >
                <LazyVideoGridContainer />
              </LazyObserverWebRTCInitializer>
            ) : (
              // Active participants: Full media initialization with capture
              <LazyMediaInitializer
                onError={(err) => {
                  toast.error(err.message);
                  setMediaInitFailed(true);
                  setMediaInitialized(true);
                }}
                onReady={() => {
                  logger.info('Media ready');
                  setMediaInitialized(true);
                }}
              >
                <LazyVideoGridContainer />
              </LazyMediaInitializer>
            )}
          </MediaSuspense>
        ) : (
          <AudioOnlyView />
        )}
      </SessionLayout>

      {isComplianceEnabled && <ComplianceOverlay />}

      {activeVerification && (
        <IdentityChallenge
          verification={activeVerification}
          status={verificationStatus}
          remainingSeconds={verificationRemainingSeconds}
          onSubmit={submitResponse}
        />
      )}

      <InactivityWarning
        isOpen={isInactivityWarningActive}
        secondsRemaining={inactivitySecondsRemaining}
        totalSeconds={30}
        onConfirm={resetInactivityTimer}
      />

      <ScreenShareRequired
        isOpen={screenShareIsRequired && !isScreenSharing}
        isLoading={screenShareIsLoading}
        permissionDenied={screenSharePermissionDenied}
        requireEntireScreen={requireEntireScreen}
        error={screenShareError}
        onRequestShare={requestScreenShare}
        onClearError={clearScreenShareError}
      />

      <ResharePrompt
        isOpen={showResharePrompt}
        isRequired={isScreenShareRequired}
        isLoading={screenShareIsLoading}
        requireEntireScreen={requireEntireScreen}
        error={screenShareError}
        onReshare={requestScreenShare}
        onDismiss={forceReshareOnStop ? undefined : dismissResharePrompt}
      />
    </>
  );
}
