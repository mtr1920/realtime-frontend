/**
 * Create Session Page
 *
 * Full-page session creation form with scheduling and configuration options.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Check,
  Loader2,
  Video,
  Link2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Separator,
  Badge,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useWorkspaces } from '@/features/workspaces';
import { useCreateSession, createSessionSchema, type CreateSessionFormData } from '@/features/sessions';

// Session created successfully - show details
interface SessionCreatedData {
  id: string;
  accessToken: string;
  workspaceName: string;
  expiresAt: string;
}

export function CreateSessionPage() {
  const navigate = useNavigate();
  const [createdSession, setCreatedSession] = useState<SessionCreatedData | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch workspaces for selection
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();

  const { createSession, isLoading: isCreating } = useCreateSession({
    onSuccess: (data) => {
      const workspace = workspaces.find((w) => w.id === data.workspaceId);
      setCreatedSession({
        id: data.id,
        accessToken: data.accessToken || '',
        workspaceName: workspace?.name || 'Unknown',
        expiresAt: data.expiresAt,
      });
      toast.success('Session created successfully');
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      workspaceId: '',
      externalId: '',
      expiresInMinutes: 60,
      scheduledAt: '',
    },
  });

  const selectedWorkspaceId = watch('workspaceId');
  const expiresInMinutes = watch('expiresInMinutes') ?? 60;

  const handleCopyToken = useCallback(async () => {
    if (!createdSession?.accessToken) return;
    await navigator.clipboard.writeText(createdSession.accessToken);
    setCopiedToken(true);
    toast.success('Access token copied to clipboard');
    setTimeout(() => setCopiedToken(false), 2000);
  }, [createdSession]);

  const onSubmit = async (data: CreateSessionFormData) => {
    await createSession({
      workspaceId: data.workspaceId,
      externalId: data.externalId || undefined,
      expiresInMinutes: data.expiresInMinutes,
      scheduledAt: data.scheduledAt || undefined,
    });
  };

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, []);

  // Show success state if session was created
  if (createdSession) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/sessions' })}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Button>

        <Card className="glass-card border-green-500/30">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Session Created!</CardTitle>
            <CardDescription>
              Your session is ready. Share the access token with participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Details */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Workspace</span>
                <span className="text-sm font-medium">{createdSession.workspaceName}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Session ID</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {createdSession.id.slice(0, 8)}...
                </code>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires</span>
                <span className="text-sm">{formatDateTime(createdSession.expiresAt)}</span>
              </div>
            </div>

            {/* Access Token */}
            {createdSession.accessToken && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Access Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={createdSession.accessToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyToken}
                    aria-label="Copy access token"
                  >
                    {copiedToken ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Share this token securely with participants. It&apos;s only shown once.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                className="flex-1"
                onClick={() => navigate({ to: `/sessions/${createdSession.id}` })}
              >
                <Video className="mr-2 h-4 w-4" />
                View Session
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreatedSession(null);
                  setCopiedToken(false);
                }}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/sessions' })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Button>

      {/* Create Form */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create New Session</CardTitle>
              <CardDescription>
                Set up a new session with your preferred configuration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Workspace Selection */}
            <div className="space-y-2">
              <Label htmlFor="workspaceId">
                Workspace <span className="text-destructive">*</span>
              </Label>
              {isLoadingWorkspaces ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedWorkspaceId}
                  onValueChange={(value) => setValue('workspaceId', value)}
                >
                  <SelectTrigger
                    id="workspaceId"
                    className={cn(errors.workspaceId && 'border-destructive')}
                    aria-invalid={!!errors.workspaceId}
                    aria-describedby={errors.workspaceId ? 'workspaceId-error' : undefined}
                  >
                    <SelectValue placeholder="Select a workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        <div className="flex items-center gap-2">
                          <span>{workspace.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {workspace.domainType}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.workspaceId && (
                <p id="workspaceId-error" className="text-sm text-destructive">
                  {errors.workspaceId.message}
                </p>
              )}
            </div>

            {/* External ID */}
            <div className="space-y-2">
              <Label htmlFor="externalId">
                External ID
                <span className="ml-1 text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="externalId"
                  placeholder="e.g., MEETING-123, interview-abc"
                  className="pl-10"
                  {...register('externalId')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A custom identifier to link this session with external systems
              </p>
            </div>

            {/* Schedule Date/Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">
                Schedule For
                <span className="ml-1 text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  className="pl-10"
                  {...register('scheduledAt')}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to create a session that starts immediately
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="expiresInMinutes">Session Duration</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={String(expiresInMinutes)}
                  onValueChange={(value) =>
                    setValue('expiresInMinutes', parseInt(value, 10))
                  }
                >
                  <SelectTrigger id="expiresInMinutes" className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum time before the session automatically expires
              </p>
            </div>

            <Separator />

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/sessions' })}
                disabled={isCreating}
                className="sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isLoadingWorkspaces}
                className="sm:flex-1"
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                )}
                Create Session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <p className="text-muted-foreground">
              Choose the workspace that best fits your session&apos;s purpose
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <p className="text-muted-foreground">
              Use external IDs to connect sessions with your existing workflow tools
            </p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <p className="text-muted-foreground">
              Schedule in advance or start immediately - participants can join using the access token
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
