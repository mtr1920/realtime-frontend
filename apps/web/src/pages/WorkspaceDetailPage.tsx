/**
 * Workspace Detail Page
 * Shows detailed information and settings for a workspace.
 */

import { Link, type LinkProps, useParams } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  FolderKanban,
  Loader2,
  Play,
  Settings,
  Trash2,
  Users,
  Video,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { usePermissions } from '@/features/auth';
import {
  useWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  updateWorkspaceSchema,
  type UpdateWorkspaceFormData,
} from '@/features/workspaces';
import { useSessions } from '@/features/sessions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Separator,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams({ strict: false }) as { workspaceId: string };
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { workspace, isLoading, isError, refetch } = useWorkspace(workspaceId);

  const { updateWorkspace, isLoading: isUpdating } = useUpdateWorkspace({
    onSuccess: () => refetch(),
  });

  const { deleteWorkspace, isLoading: isDeleting } = useDeleteWorkspace({
    onSuccess: () => {
      navigate({ to: '/workspaces' });
    },
  });

  // Fetch sessions for this workspace
  const { sessions, isLoading: isLoadingSessions } = useSessions({
    workspaceId,
    limit: 100, // Get enough to calculate stats
    enabled: !!workspaceId,
  });

  // Calculate session statistics
  const sessionStats = {
    total: sessions.length,
    scheduled: sessions.filter((s) => s.status === 'CREATED' || s.status === 'WAITING').length,
    live: sessions.filter((s) => s.status === 'ACTIVE').length,
    completed: sessions.filter((s) => s.status === 'COMPLETED').length,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateWorkspaceFormData>({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspace
      ? {
          name: workspace.name,
          description: workspace.description ?? '',
        }
      : undefined,
  });

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const handleCopyId = useCallback(async () => {
    if (!workspace) return;
    await navigator.clipboard.writeText(workspace.id);
    setCopied(true);
    toast.success('Workspace ID copied');
    setTimeout(() => setCopied(false), 2000);
  }, [workspace]);

  const onSubmit = useCallback(
    async (data: UpdateWorkspaceFormData) => {
      if (!workspace) return;
      await updateWorkspace(workspace.id, {
        name: data.name,
        description: data.description || undefined,
      });
    },
    [workspace, updateWorkspace]
  );

  const handleDelete = useCallback(async () => {
    if (!workspace) return;
    await deleteWorkspace(workspace.id);
  }, [workspace, deleteWorkspace]);

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
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to={'/workspaces' as LinkProps['to']}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Link>
        </Button>
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CardTitle className="text-xl mb-2 text-destructive">
              Workspace not found
            </CardTitle>
            <CardDescription className="text-center mb-4">
              The workspace you are looking for does not exist or you do not
              have access to it.
            </CardDescription>
            <Button asChild>
              <Link to={'/workspaces' as LinkProps['to']}>Go to Workspaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={'/workspaces' as LinkProps['to']}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to workspaces</span>
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <FolderKanban className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {workspace.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="font-mono">/{workspace.slug}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopyId}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={workspace.isActive ? 'default' : 'secondary'}>
            {workspace.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{workspace.domainType}</Badge>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {hasPermission('canEditWorkspace') && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Workspace Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Workspace Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{workspace.name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Slug</span>
                  <span className="text-sm font-mono">/{workspace.slug}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Domain Type
                  </span>
                  <Badge variant="outline">{workspace.domainType}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Created
                  </span>
                  <span className="text-sm">{formatDate(workspace.createdAt)}</span>
                </div>
                {workspace.description && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Description
                      </span>
                      <p className="text-sm mt-1">{workspace.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Session Statistics */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Session Statistics
                </CardTitle>
                <CardDescription>
                  Overview of sessions in this workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSessions ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={`stat-skeleton-${i}`} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-8" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{sessionStats.total}</p>
                          <p className="text-xs text-muted-foreground">Total Sessions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                          <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{sessionStats.scheduled}</p>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                          <Play className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{sessionStats.live}</p>
                          <p className="text-xs text-muted-foreground">Live Now</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                          <CheckCircle className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{sessionStats.completed}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={'/sessions' as LinkProps['to']}>
                        View All Sessions
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Members (Coming Soon) */}
            <Card className="glass-card md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage workspace access and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">Team Management Coming Soon</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    You&apos;ll soon be able to invite team members, assign roles, and manage
                    access permissions for this workspace.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {hasPermission('canEditWorkspace') && (
          <TabsContent value="settings" className="space-y-6 mt-6">
            {/* Edit Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workspace Settings
                </CardTitle>
                <CardDescription>
                  Update your workspace name and description.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      className={cn(errors.name && 'border-destructive')}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      {...register('description')}
                      placeholder="A brief description"
                    />
                  </div>
                  <Button type="submit" disabled={isUpdating || !isDirty}>
                    {isUpdating && (
                      <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {hasPermission('canDeleteWorkspace') && (
              <Card className="glass-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Permanently delete this workspace and all its data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Workspace
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{workspace.name}&quot;? This
              will permanently remove all sessions, data, and settings associated
              with this workspace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
