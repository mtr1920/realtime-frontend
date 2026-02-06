/**
 * Create Session Dialog
 * Modal form for creating a new session.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Shuffle } from 'lucide-react';
import {
  createSessionSchema,
  type CreateSessionFormData,
} from '../../schemas/session.schema';
import { useCreateSession } from '../../hooks/useCreateSession';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface Workspace {
  id: string;
  name: string;
}

interface RoleOption {
  id: string;
  name: string;
}

/**
 * Generate a random ID in format xxx-xxxx-xxx-xxx
 * Uses lowercase letters and numbers only
 */
function generateRandomId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [3, 4, 3, 3];

  return segments
    .map((length) =>
      Array.from({ length }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    )
    .join('-');
}

/** Default roles available for session creation */
const DEFAULT_ROLES: RoleOption[] = [
  { id: 'interviewer', name: 'Interviewer' },
  { id: 'presales', name: 'Pre-Sales' },
  { id: 'trainer', name: 'Trainer' },
  { id: 'support', name: 'Support Agent' },
];

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: Workspace[];
  defaultWorkspaceId?: string;
  /** Available roles (defaults to standard roles if not provided) */
  roles?: RoleOption[];
  /** Default role ID to pre-select */
  defaultRoleId?: string;
  onSuccess?: () => void;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
  workspaces,
  defaultWorkspaceId,
  roles = DEFAULT_ROLES,
  defaultRoleId,
  onSuccess,
}: CreateSessionDialogProps) {
  const { createSession, isLoading } = useCreateSession({
    onSuccess: () => {
      onOpenChange(false);
      reset();
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      workspaceId: defaultWorkspaceId ?? '',
      roleId: defaultRoleId ?? roles?.[0]?.id ?? '',
      externalId: '',
      expiresInMinutes: 60,
    },
  });

  const selectedWorkspaceId = watch('workspaceId');
  const selectedRoleId = watch('roleId');

  const onSubmit = async (data: CreateSessionFormData) => {
    await createSession({
      workspaceId: data.workspaceId,
      roleId: data.roleId,
      configBundleId: data.configBundleId,
      externalId: data.externalId || undefined,
      expiresInMinutes: data.expiresInMinutes,
      scheduledAt: data.scheduledAt || undefined,
      metadata: data.metadata,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Create a new session for your workspace. You can customize the
            settings below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspaceId">Workspace</Label>
            <Select
              value={selectedWorkspaceId}
              onValueChange={(value) => setValue('workspaceId', value)}
            >
              <SelectTrigger
                className={cn(errors.workspaceId && 'border-destructive')}
              >
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.workspaceId && (
              <p className="text-sm text-destructive">
                {errors.workspaceId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleId">Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={(value) => setValue('roleId', value)}
            >
              <SelectTrigger
                className={cn(errors.roleId && 'border-destructive')}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-sm text-destructive">
                {errors.roleId.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The role determines the session configuration and permissions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalId">External ID (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="externalId"
                placeholder="e.g., MEETING-123"
                {...register('externalId')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setValue('externalId', generateRandomId())}
                title="Generate random ID"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A custom identifier for this session
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresInMinutes">Session Duration (minutes)</Label>
            <Select
              value={String(watch('expiresInMinutes') ?? 60)}
              onValueChange={(value) =>
                setValue('expiresInMinutes', parseInt(value, 10))
              }
            >
              <SelectTrigger>
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
