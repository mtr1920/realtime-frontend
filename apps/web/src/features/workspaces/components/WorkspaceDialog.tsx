/**
 * Workspace Dialog
 * Modal dialog for editing workspace settings.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateWorkspaceSchema,
  type UpdateWorkspaceFormData,
} from '../schemas/workspace.schema';
import { useUpdateWorkspace } from '../hooks/useUpdateWorkspace';
import type { Workspace } from '../api/workspaces.service';
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
  Checkbox,
} from '@/shared/ui';
import { SubmitButton } from '@/shared/components';
import { cn } from '@/shared/lib/utils';

const domainTypeLabels: Record<string, string> = {
  interview: 'Interview',
  presales: 'Pre-Sales',
  hr: 'People Management',
  training: 'Training',
  support: 'Support',
  consultation: 'Consultation',
  custom: 'Custom',
};

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  onSuccess?: () => void;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onSuccess,
}: WorkspaceDialogProps) {
  const { updateWorkspace, isLoading } = useUpdateWorkspace({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateWorkspaceFormData>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description ?? '',
      configId: workspace.configId ?? undefined,
      isActive: workspace.isActive,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: UpdateWorkspaceFormData) => {
    await updateWorkspace(workspace.id, {
      name: data.name,
      description: data.description || undefined,
      configId: data.configId || undefined,
      isActive: data.isActive,
      settings: data.settings,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Update workspace details and configuration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              placeholder="Workspace name"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'edit-name-error' : undefined}
            />
            {errors.name && (
              <p id="edit-name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>URL Slug</Label>
            <Input
              value={`/${workspace.slug}`}
              disabled
              className="bg-muted"
              aria-readonly="true"
            />
            <p className="text-xs text-muted-foreground">
              Slug cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Domain Type</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
              {domainTypeLabels[workspace.domainType] || workspace.domainType}
            </div>
            <p className="text-xs text-muted-foreground">
              Domain type cannot be changed after creation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              placeholder="A brief description of this workspace"
              {...register('description')}
              className={cn(errors.description && 'border-destructive')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-configId">Domain Configuration</Label>
            <Input
              id="edit-configId"
              placeholder="Config ID (optional)"
              {...register('configId')}
            />
            <p className="text-xs text-muted-foreground">
              Link this workspace to a specific domain configuration.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="edit-isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked === true)}
            />
            <Label htmlFor="edit-isActive" className="cursor-pointer">
              Workspace is active
            </Label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <SubmitButton type="submit" isLoading={isLoading}>
              Save Changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
