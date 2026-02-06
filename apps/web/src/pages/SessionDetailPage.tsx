/**
 * Session Detail Page
 * Enhanced session detail view with tabbed interface showing
 * overview, participants, configuration, activity, recordings, and outcomes.
 */

import { Link, type LinkProps, useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Loader2,
  Play,
  Square,
  MoreHorizontal,
  Link2,
  XCircle,
  Clock,
  Trash2,
  CopyPlus,
  ChevronRight,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePermissions } from '@/features/auth';
import {
  useSession,
  useCompleteSession,
  useStartSession,
  useSessionParticipants,
  sessionsService,
  SessionStatusBadge,
  CopyInviteLinkButton,
  SessionOverviewTab,
  SessionParticipantsTab,
  SessionConfigurationTab,
  SessionActivityTab,
  SessionRecordingsTab,
  SessionOutcomesTab,
  ShareLinksTab,
  CancelSessionDialog,
  DeleteSessionDialog,
  ExtendSessionDialog,
  DuplicateSessionDialog,
  type DuplicateOptions,
} from '@/features/sessions';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

type TabValue = 'overview' | 'participants' | 'configuration' | 'activity' | 'recordings' | 'outcomes' | 'share-links';

export function SessionDetailPage() {
  const { sessionId } = useParams({ strict: false }) as { sessionId: string };
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const { session, isLoading, isError, refetch } = useSession(sessionId);
  const { completeSession, isLoading: isCompleting } = useCompleteSession({
    onSuccess: () => refetch(),
  });
  const { startSession, isLoading: isStarting } = useStartSession({
    onSuccess: () => refetch(),
  });

  // Fetch participants for CancelSessionDialog (needs active participant count)
  const { participants } = useSessionParticipants(sessionId);

  const canStart = session?.status === 'CREATED';
  const canInvite = session?.status === 'CREATED' || session?.status === 'WAITING';
  const canJoin = session?.status === 'CREATED' || session?.status === 'WAITING' || session?.status === 'ACTIVE';
  const canComplete = session?.status === 'ACTIVE' || session?.status === 'PAUSED';
  const canCancel = session?.status === 'CREATED' || session?.status === 'WAITING';
  const canDelete =
    session?.status === 'COMPLETED' ||
    session?.status === 'EXPIRED' ||
    session?.status === 'FAILED';

  const handleJoin = useCallback(() => {
    if (!session) return;
    // Navigate to lobby for proper join flow (permissions, consent, etc.)
    navigate({ to: `/sessions/${session.id}/lobby` as LinkProps['to'] });
  }, [session, navigate]);

  const handleComplete = useCallback(async () => {
    if (!session) return;
    await completeSession(session.id);
  }, [session, completeSession]);

  const handleStart = useCallback(async () => {
    if (!session) return;
    await startSession(session.id);
    // Navigate to lobby for proper join flow (permissions, consent, etc.)
    navigate({ to: `/sessions/${session.id}/lobby` as LinkProps['to'] });
  }, [session, startSession, navigate]);

  const handleCancelConfirm = useCallback(async (reason?: string) => {
    if (!session) return;
    try {
      await sessionsService.cancel(session.id, { reason });
      toast.success('Session cancelled');
      refetch();
    } catch {
      toast.error('Failed to cancel session');
      throw new Error('Failed to cancel session');
    }
  }, [session, refetch]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!session) return;
    try {
      await sessionsService.delete(session.id);
      toast.success('Session deleted');
      navigate({ to: '/sessions' as LinkProps['to'] });
    } catch {
      toast.error('Failed to delete session');
      throw new Error('Failed to delete session');
    }
  }, [session, navigate]);

  const handleDuplicateConfirm = useCallback(async (options: DuplicateOptions) => {
    if (!session) return;
    try {
      const newSession = await sessionsService.duplicate(session.id, {
        workspaceId: options.workspaceId,
        scheduledAt: options.scheduledAt,
      });
      toast.success('Session duplicated');
      navigate({ to: `/sessions/${newSession.id}` as LinkProps['to'] });
    } catch {
      toast.error('Failed to duplicate session');
      throw new Error('Failed to duplicate session');
    }
  }, [session, navigate]);

  const handleExtendConfirm = useCallback(async (newExpiry: string) => {
    if (!session) return;
    try {
      await sessionsService.extend(session.id, { expiresAt: newExpiry });
      toast.success('Session expiry extended');
      refetch();
    } catch {
      toast.error('Failed to extend session');
      throw new Error('Failed to extend session');
    }
  }, [session, refetch]);

  const handleCopyInviteLink = useCallback(async () => {
    if (!session) return;
    try {
      // Get invite info to find available roles
      const inviteInfo = await sessionsService.getInviteInfo(session.id);
      const firstRole = inviteInfo.roles?.[0];
      if (!firstRole) {
        toast.error('No roles available for this session');
        return;
      }

      // Generate a short-lived invite code for the first role
      const { code } = await sessionsService.createInviteCode(session.id, firstRole.id);

      // Build URL with code (matches router /sessions/$sessionId/lobby route)
      const inviteUrl = `${window.location.origin}/sessions/${session.id}/lobby?code=${encodeURIComponent(code)}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied');
    } catch {
      toast.error('Failed to copy invite link');
    }
  }, [session]);

  // Get primary action based on session status
  const getPrimaryAction = () => {
    if (canStart && hasPermission('canStartSession')) {
      return (
        <Button onClick={handleStart} disabled={isStarting}>
          {isStarting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Start Session
        </Button>
      );
    }

    if (canJoin) {
      return (
        <Button onClick={handleJoin}>
          <Play className="mr-2 h-4 w-4" />
          Join Session
        </Button>
      );
    }

    if (canComplete && hasPermission('canEndSession')) {
      return (
        <Button variant="destructive" onClick={handleComplete} disabled={isCompleting}>
          {isCompleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          End Session
        </Button>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/sessions' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Link>
        </Button>
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CardTitle className="text-xl mb-2 text-destructive">
              Session not found
            </CardTitle>
            <CardDescription className="text-center mb-4">
              The session you are looking for does not exist or you do not have
              access to it.
            </CardDescription>
            <Button asChild>
              <Link to={'/sessions' as LinkProps['to']}>Go to Sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full">
      {/* Breadcrumb and Header */}
      <div className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to={'/sessions' as LinkProps['to']}
            className="hover:text-foreground transition-colors"
          >
            Sessions
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {session.externalId || session.id.slice(0, 8)}
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={'/sessions' as LinkProps['to']}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to sessions</span>
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {session.externalId || `Session ${session.id.slice(0, 8)}`}
                </h1>
                <SessionStatusBadge status={session.status} size="lg" />
              </div>
              <p className="text-sm text-muted-foreground">
                {session.domainType} session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canInvite && <CopyInviteLinkButton sessionId={session.id} />}
            {getPrimaryAction()}

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canInvite && (
                  <DropdownMenuItem onClick={handleCopyInviteLink}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy invite link
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
                  <CopyPlus className="mr-2 h-4 w-4" />
                  Duplicate session
                </DropdownMenuItem>
                {(canStart || canJoin || canComplete) && (
                  <DropdownMenuItem onClick={() => setExtendDialogOpen(true)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Extend expiry
                  </DropdownMenuItem>
                )}
                {canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setCancelDialogOpen(true)}
                      className="text-amber-600 focus:text-amber-600"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel session
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete session
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="configuration">Config</TabsTrigger>
          <TabsTrigger value="share-links">Share Links</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <SessionOverviewTab session={session} />
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <SessionParticipantsTab sessionId={session.id} canRemove={false} />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <SessionConfigurationTab
            configSnapshot={(session.metadata as { configSnapshot?: unknown })?.configSnapshot ?? null}
          />
        </TabsContent>

        <TabsContent value="share-links" className="mt-6">
          <ShareLinksTab
            sessionId={session.id}
            roles={[
              { id: 'candidate', name: 'Candidate' },
              { id: 'observer', name: 'Observer' },
              { id: 'interviewer', name: 'Interviewer' },
            ]}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <SessionActivityTab sessionId={session.id} />
        </TabsContent>

        <TabsContent value="recordings" className="mt-6">
          <SessionRecordingsTab sessionId={session.id} />
        </TabsContent>

        <TabsContent value="outcomes" className="mt-6">
          <SessionOutcomesTab sessionId={session.id} />
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <CancelSessionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        sessionId={session.id}
        hasActiveParticipants={participants.some((p) => p.status === 'ACTIVE')}
        participantCount={participants.filter((p) => p.status === 'ACTIVE').length}
        onConfirm={handleCancelConfirm}
      />

      <DeleteSessionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        sessionId={session.id}
        externalId={session.externalId ?? undefined}
        onConfirm={handleDeleteConfirm}
      />

      <ExtendSessionDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        sessionId={session.id}
        currentExpiry={session.expiresAt}
        onConfirm={handleExtendConfirm}
      />

      <DuplicateSessionDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        sessionId={session.id}
        currentWorkspaceId={session.workspaceId}
        onConfirm={handleDuplicateConfirm}
      />
    </div>
  );
}
