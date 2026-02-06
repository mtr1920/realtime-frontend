/**
 * Sessions Page
 * Production-ready sessions management dashboard with DataTable filtering,
 * and grid/table view modes.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, type LinkProps } from '@tanstack/react-router';
import { Plus, Video, LayoutGrid, List, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/features/auth';
import {
  useSessions,
  useCompleteSession,
  useStartSession,
  sessionsService,
  SessionCard,
  CreateSessionDialog,
  SessionsStatsHeader,
  SessionsSharedDataTable,
  sessionExportColumns,
  type Session,
  type SessionStatus,
} from '@/features/sessions';
import { exportToCsv, exportToExcel } from '@realtime/ui/utils';
import { useWorkspaces } from '@/features/workspaces';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TooltipProvider,
} from '@/shared/ui';

type ViewMode = 'table' | 'grid';

export function SessionsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | null>(null);

  // Fetch sessions
  const { sessions: allSessions, isLoading, isError, refetch } = useSessions({
    limit: 100,
  });

  const { workspaces } = useWorkspaces();

  const { completeSession } = useCompleteSession({
    onSuccess: () => refetch(),
  });

  const { startSession } = useStartSession({
    onSuccess: () => refetch(),
  });

  // Map workspaces to dialog format
  const workspaceOptions = useMemo(
    () =>
      workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
      })),
    [workspaces]
  );

  // Filter sessions by status
  const filteredSessions = useMemo(() => {
    if (!statusFilter) return allSessions;
    return allSessions.filter((session) => session.status === statusFilter);
  }, [allSessions, statusFilter]);

  // Action handlers
  const handleJoinSession = useCallback(
    (session: Session) => {
      // Navigate to lobby for proper join flow (permissions, consent, etc.)
      navigate({ to: `/sessions/${session.id}/lobby` as '/' });
    },
    [navigate]
  );

  const handleStartSession = useCallback(
    async (session: Session) => {
      await startSession(session.id);
      // Navigate to lobby for proper join flow (permissions, consent, etc.)
      navigate({ to: `/sessions/${session.id}/lobby` as '/' });
    },
    [startSession, navigate]
  );

  const handleCompleteSession = useCallback(
    async (session: Session) => {
      await completeSession(session.id);
    },
    [completeSession]
  );

  const handleCancelSession = useCallback(
    async (session: Session) => {
      try {
        await sessionsService.cancel(session.id);
        toast.success('Session cancelled');
        refetch();
      } catch {
        toast.error('Failed to cancel session');
      }
    },
    [refetch]
  );

  const handleDeleteSession = useCallback(
    async (session: Session) => {
      try {
        await sessionsService.delete(session.id);
        toast.success('Session deleted');
        refetch();
      } catch {
        toast.error('Failed to delete session');
      }
    },
    [refetch]
  );

  const handleDuplicateSession = useCallback(
    async (session: Session) => {
      try {
        const newSession = await sessionsService.duplicate(session.id);
        toast.success('Session duplicated');
        navigate({ to: `/sessions/${newSession.id}` as LinkProps['to'] });
      } catch {
        toast.error('Failed to duplicate session');
      }
    },
    [navigate]
  );

  const handleExportCsv = useCallback(
    (sessionsToExport: Session[]) => {
      try {
        exportToCsv(sessionsToExport, sessionExportColumns, { filename: 'sessions' });
        toast.success(`Exported ${sessionsToExport.length} session(s) to CSV`);
      } catch {
        toast.error('Failed to export sessions to CSV');
      }
    },
    []
  );

  const handleExportExcel = useCallback(
    (sessionsToExport: Session[]) => {
      try {
        exportToExcel(sessionsToExport, sessionExportColumns, {
          filename: 'sessions',
          sheetName: 'Sessions',
        });
        toast.success(`Exported ${sessionsToExport.length} session(s) to Excel`);
      } catch {
        toast.error('Failed to export sessions to Excel');
      }
    },
    []
  );

  const handleCopyInviteLink = useCallback(
    async (session: Session) => {
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
    },
    []
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filter tabs with actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stats Header (filter tabs) */}
          {!isLoading && !isError && (
            <SessionsStatsHeader
              sessions={allSessions}
              selectedStatus={statusFilter}
              onStatusFilter={setStatusFilter}
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle and create button */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="grid w-[100px] grid-cols-2">
              <TabsTrigger value="table" aria-label="Table view">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {hasPermission('canCreateSession') && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 motion-safe:animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CardTitle className="text-xl mb-2 text-destructive">
                Failed to load sessions
              </CardTitle>
              <CardDescription className="text-center mb-4">
                Something went wrong while fetching sessions.
              </CardDescription>
              <Button onClick={() => refetch()}>Try again</Button>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        {!isLoading && !isError && allSessions.length > 0 && (
          <>
            {viewMode === 'table' ? (
              <SessionsSharedDataTable
                sessions={filteredSessions}
                onJoin={handleJoinSession}
                onStart={hasPermission('canStartSession') ? handleStartSession : undefined}
                onComplete={hasPermission('canEndSession') ? handleCompleteSession : undefined}
                onCancel={handleCancelSession}
                onDelete={handleDeleteSession}
                onDuplicate={handleDuplicateSession}
                onCopyInviteLink={handleCopyInviteLink}
                onExportCsv={handleExportCsv}
                onExportExcel={handleExportExcel}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSessions.map((session, index) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    index={index}
                    onJoin={handleJoinSession}
                    onComplete={handleCompleteSession}
                    className="motion-safe:animate-slide-up-fade"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && allSessions.length === 0 && (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">No sessions yet</CardTitle>
              <CardDescription className="text-center max-w-sm mb-6">
                Get started by creating your first session. Sessions allow you to collaborate in real-time with your team.
              </CardDescription>
              {hasPermission('canCreateSession') && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Session Dialog */}
        <CreateSessionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          workspaces={workspaceOptions}
          onSuccess={() => refetch()}
        />
      </div>
    </TooltipProvider>
  );
}
