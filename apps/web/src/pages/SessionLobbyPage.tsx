/**
 * Session Lobby Page
 *
 * Pre-join page for sessions with device permissions, media preview,
 * consent collection, and join functionality.
 *
 * Supports invite code flow where codes are exchanged for access tokens.
 * Invite codes remain valid until their TTL expires (configurable, default 24h).
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, type LinkProps } from '@tanstack/react-router';
import { ArrowLeft, AlertCircle, Clock, Monitor, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, useAuthHydrated } from '@/shared/stores/auth.store';
import { useCurrentUser } from '@/shared/hooks';
import {
  useSession,
  useJoinSession,
  useSessionInviteInfo,
  useCodeExchange,
  useLobbyAuthRedirect,
} from '@/features/sessions';
import {
  DeviceCheckPanel,
  MediaPreview,
  ConsentPanel,
  JoinPanel,
  SessionErrorState,
} from '@/features/sessions/components/lobby';
import type { SessionErrorType } from '@/features/sessions/utils/sessionErrors';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { Button, Card, CardContent, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export function SessionLobbyPage() {
  const { sessionId } = useParams({ strict: false }) as { sessionId: string };
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthHydrated = useAuthHydrated();

  // Get URL params for detecting share link flow
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');
  const tokenFromUrl = searchParams.get('token');

  // Code exchange hook - handles invite code -> access token exchange
  const {
    accessToken,
    roleId,
    requiresAuth,
    isExchanging: isExchangingCode,
    error: codeExchangeError,
    setAccessToken,
    setRoleId,
  } = useCodeExchange({ isAuthHydrated });

  // Auth redirect hook - handles redirecting to login when needed
  useLobbyAuthRedirect({
    sessionId,
    isAuthHydrated,
    isAuthenticated,
    hasCode: !!code,
    hasTokenFromUrl: !!tokenFromUrl,
    requiresAuth,
    hasCodeExchangeError: !!codeExchangeError,
  });

  // State
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [isObserver, setIsObserver] = useState(false);

  // Session error state for expired/invalid sessions
  const [sessionError, setSessionError] = useState<{
    type: SessionErrorType;
    message: string;
  } | null>(null);

  // Media store
  const { isAudioEnabled, isVideoEnabled, setAudioEnabled, setVideoEnabled, reset: resetMediaStore } =
    useMediaStore();

  // Session store
  const { setRealtimeCredentials, setLocalParticipantId, setJoinContext, reset } =
    useSessionStore();

  // Fetch session data - only if authenticated (unauthenticated users join via code exchange)
  const { session, isLoading, isError, error } = useSession(sessionId, {
    enabled: isAuthenticated,
  });

  // Fetch invite info to get roles with their isObserver flags - only if authenticated
  // This also provides an accessToken for authenticated users without a code or token
  const { inviteInfo } = useSessionInviteInfo(sessionId, {
    enabled: !!sessionId && isAuthenticated && !code && !tokenFromUrl, // Skip if using invite code or share link token
  });

  // For authenticated users without a code/token, use invite info to get access token
  useEffect(() => {
    // Skip if we have a token from URL (share link flow) or code (invite code flow)
    if (tokenFromUrl || code) return;

    if (isAuthenticated && inviteInfo?.accessToken && !accessToken) {
      setAccessToken(inviteInfo.accessToken);
      // Auto-select first role if not set
      if (!roleId && inviteInfo.roles?.[0]) {
        setRoleId(inviteInfo.roles[0].id);
      }
    }
  }, [tokenFromUrl, code, isAuthenticated, inviteInfo, accessToken, roleId, setAccessToken, setRoleId]);

  // Join mutation
  const { joinSession, isLoading: isJoining, errorMessage } = useJoinSession({
    onSuccess: (response) => {
      // Store credentials for WebSocket connection
      setRealtimeCredentials(response.realtimeToken, response.wsEndpoint);
      setLocalParticipantId(response.participantId);

      toast.success('Joined session successfully');

      // Navigate to room
      navigate({
        to: '/sessions/$sessionId/room',
        params: { sessionId },
      });
    },
    onError: (err) => {
      // Only show toast for non-session-specific errors
      // Session-specific errors are handled via onSessionError
      if (!sessionError) {
        toast.error(err.message || 'Failed to join session');
      }
    },
    onSessionError: (err, errorType) => {
      // Set session error state to show SessionErrorState component
      setSessionError({
        type: errorType,
        message: errorMessage ?? err.message,
      });
    },
  });

  // Reset session and media stores on mount
  useEffect(() => {
    reset();
    resetMediaStore();
  }, [reset, resetMediaStore]);

  // Determine observer status from role configuration (permission-based, not hardcoded)
  // This derives observer status from the role's actual permissions instead of string matching
  const computedIsObserver = useMemo(() => {
    if (!roleId || !inviteInfo?.roles) return false;
    const selectedRole = inviteInfo.roles.find((r) => r.id === roleId);
    return selectedRole?.isObserver ?? false;
  }, [roleId, inviteInfo?.roles]);

  useEffect(() => {
    setIsObserver(computedIsObserver);
  }, [computedIsObserver]);

  const handlePermissionsGranted = useCallback((audio: boolean, video: boolean) => {
    setPermissionsGranted(audio || video);
    setAudioEnabled(audio);
    setVideoEnabled(video);
  }, [setAudioEnabled, setVideoEnabled]);

  const handleConsentChange = useCallback(
    (allRequired: boolean) => {
      setConsentGranted(allRequired);
    },
    []
  );

  const handleJoin = useCallback(
    async (displayName: string) => {
      if (!sessionId) return;

      // Store displayName and roleId for session.join message after WebSocket connects
      setJoinContext(displayName, roleId);

      await joinSession(sessionId, {
        accessToken,
        roleId,
        displayName,
        userId: user?.id,
      });
    },
    [sessionId, accessToken, roleId, user?.id, joinSession, setJoinContext]
  );

  // Check if session requires consent
  const sessionConfig = session?.metadata as {
    recording?: boolean;
    compliance?: boolean;
    browserLock?: boolean;
    screenShareRequired?: boolean;
    requireEntireScreen?: boolean;
  } | null;
  const requiresConsent =
    sessionConfig?.recording ||
    sessionConfig?.compliance ||
    sessionConfig?.browserLock;
  const screenShareRequired = sessionConfig?.screenShareRequired ?? false;
  const requireEntireScreen = sessionConfig?.requireEntireScreen ?? false;

  // Determine if join is allowed
  const canJoin = permissionsGranted && (!requiresConsent || consentGranted) && accessToken && roleId;
  const disabledReason = !permissionsGranted
    ? 'Please allow camera/microphone access'
    : !consentGranted && requiresConsent
    ? 'Please accept required consents'
    : !accessToken || !roleId
    ? 'Loading session access...'
    : undefined;

  // For unauthenticated users with access token, we don't have session data
  // They can still join using the access token from code exchange
  const canProceedWithoutSession = !isAuthenticated && !!accessToken && requiresAuth === false;

  // Loading state (including code exchange and auth hydration)
  if (!isAuthHydrated || (isLoading && isAuthenticated) || isExchangingCode) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        {isExchangingCode && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 motion-safe:animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Verifying invite link...</p>
            </CardContent>
          </Card>
        )}
        {!isExchangingCode && (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-video" />
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Session error state (expired, invalid status, etc.)
  if (sessionError) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>

        <SessionErrorState
          type={sessionError.type}
          message={sessionError.message}
          sessionId={sessionId}
          onRetry={() => setSessionError(null)}
        />
      </div>
    );
  }

  // Code exchange error state
  if (codeExchangeError) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>

        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden />
            <h2 className="text-xl font-semibold mb-2">Invalid Invite Link</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {codeExchangeError}
            </p>
            <Button asChild>
              <Link to={'/sessions' as LinkProps['to']}>Go to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - allow unauthenticated users with valid access token to proceed
  if (isError || (!session && !canProceedWithoutSession)) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>

        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Session</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {error?.message ||
                'The session could not be found or you do not have access.'}
            </p>
            <Button asChild>
              <Link to={'/sessions' as LinkProps['to']}>Go to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if session is joinable (skip check for unauthenticated users - backend will validate)
  // CREATED, WAITING, and ACTIVE sessions can be joined
  const isJoinable = !session || session.status === 'CREATED' || session.status === 'WAITING' || session.status === 'ACTIVE';
  if (!isJoinable && session) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>

        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
            <h2 className="text-xl font-semibold mb-2">Session Not Available</h2>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              This session is currently{' '}
              <span className="font-medium">{session.status.toLowerCase()}</span> and
              cannot be joined.
            </p>
            <Button asChild>
              <Link to={`/sessions/${sessionId}` as LinkProps['to']}>
                View Session Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to sessions</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Join Session</h1>
          <p className="text-sm text-muted-foreground">
            Session {session?.externalId || session?.id?.slice(0, 8) || sessionId.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Media Preview */}
        <div className="space-y-4">
          <MediaPreview
            audioEnabled={isAudioEnabled}
            videoEnabled={isVideoEnabled}
            onAudioToggle={setAudioEnabled}
            onVideoToggle={setVideoEnabled}
            showDeviceSelection
            className={cn(isObserver && 'opacity-50 pointer-events-none')}
          />

          {isObserver && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                As an observer, your camera and microphone will not be used.
              </p>
            </div>
          )}

          {/* Screen Share Notice (not for observers) */}
          {screenShareRequired && !isObserver && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Screen sharing required
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This session requires you to share your screen to participate.
                    {requireEntireScreen && ' You must share your entire screen (not a specific tab or window).'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Setup Steps */}
        <div className="space-y-4">
          {/* Device Permissions */}
          {!isObserver && (
            <DeviceCheckPanel
              onPermissionsGranted={handlePermissionsGranted}
              autoRequest={false}
            />
          )}

          {/* Consent Panel */}
          {requiresConsent && (
            <ConsentPanel
              recordingEnabled={sessionConfig?.recording}
              complianceEnabled={sessionConfig?.compliance}
              browserLockEnabled={sessionConfig?.browserLock}
              onConsentChange={handleConsentChange}
            />
          )}

          {/* Join Panel */}
          <JoinPanel
            sessionTitle={session?.externalId || `Session ${session?.id?.slice(0, 8) || sessionId.slice(0, 8)}`}
            initialDisplayName={user?.displayName || user?.email || ''}
            roleDisplayName={roleId ? roleId.replace(/_/g, ' ') : undefined}
            isObserver={isObserver}
            isJoining={isJoining}
            disabled={!isObserver && !canJoin}
            disabledReason={isObserver ? undefined : disabledReason}
            onJoin={handleJoin}
          />
        </div>
      </div>
    </div>
  );
}
