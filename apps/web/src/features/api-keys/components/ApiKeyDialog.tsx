/**
 * ApiKeyDialog Component
 * Dialog wrappers for creating and managing API keys.
 */

import { useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { ApiKeyScopesSelect } from './ApiKeyScopesSelect';
import { useCreateApiKey } from '../hooks/useCreateApiKey';
import { useUpdateApiKey } from '../hooks/useUpdateApiKey';
import { createApiKeySchema, type CreateApiKeyFormData } from '../schemas/api-keys.schema';
import { showSuccess, showInfo, handleError } from '@/shared/errors';
import type { ApiKey, ApiKeyScope } from '../types/api-keys.types';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

// =============================================================================
// Create API Key Dialog
// =============================================================================

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateApiKeyDialog({ open, onOpenChange }: CreateApiKeyDialogProps) {
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const { createApiKey, isLoading } = useCreateApiKey({
    onSuccess: (result) => {
      setNewSecret(result.secret);
      showSuccess('API key created successfully. Copy the secret below.');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to create API key' });
    },
  });

  const form = useForm({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
      scopes: [] as ApiKeyScope[],
      expiresAt: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form;

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    await createApiKey(data as CreateApiKeyFormData);
  };

  const handleClose = useCallback(() => {
    setNewSecret(null);
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  const handleCopySecret = useCallback(() => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      showInfo('Secret copied to clipboard');
    }
  }, [newSecret]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {newSecret ? 'API Key Created' : 'Create API Key'}
          </DialogTitle>
          <DialogDescription>
            {newSecret
              ? 'Copy the API key secret below. It will only be shown once.'
              : 'Configure a new API key for programmatic access.'}
          </DialogDescription>
        </DialogHeader>

        {newSecret ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">API Key Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={newSecret}
                  readOnly
                  className="font-mono text-xs"
                  aria-label="API key secret"
                />
                <Button onClick={handleCopySecret}>Copy</Button>
              </div>
              <p className="text-sm text-warning-foreground bg-warning/20 rounded-md p-2">
                Make sure to copy this secret. You won't be able to see it again.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My API Key"
                disabled={isLoading}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <Controller
              name="scopes"
              control={control}
              render={({ field }) => (
                <ApiKeyScopesSelect
                  value={field.value as ApiKeyScope[]}
                  onChange={field.onChange}
                  disabled={isLoading}
                  error={errors.scopes?.message as string}
                />
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration (optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register('expiresAt')}
                disabled={isLoading}
                aria-describedby="expires-hint"
              />
              <p id="expires-hint" className="text-xs text-muted-foreground">
                Leave blank for a non-expiring key
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create API Key'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Edit API Key Dialog
// =============================================================================

interface EditApiKeyDialogProps {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: EditApiKeyDialogProps) {
  const { updateApiKey, isLoading } = useUpdateApiKey({
    onSuccess: () => {
      onOpenChange(false);
      showSuccess('API key updated successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to update API key' });
    },
  });

  const form = useForm({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: apiKey
      ? {
          name: apiKey.name,
          scopes: apiKey.scopes,
        }
      : {
          name: '',
          scopes: [] as ApiKeyScope[],
        },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (!apiKey) return;
    await updateApiKey({
      id: apiKey.id,
      data: { name: data.name, scopes: data.scopes },
    });
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit API Key</DialogTitle>
          <DialogDescription>
            Update the configuration for {apiKey.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              {...register('name')}
              placeholder="My API Key"
              disabled={isLoading}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message as string}
              </p>
            )}
          </div>

          <Controller
            name="scopes"
            control={control}
            render={({ field }) => (
              <ApiKeyScopesSelect
                value={field.value as ApiKeyScope[]}
                onChange={field.onChange}
                disabled={isLoading}
                error={errors.scopes?.message as string}
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Revoke API Key Dialog
// =============================================================================

interface RevokeApiKeyDialogProps {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RevokeApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RevokeApiKeyDialogProps) {
  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke "{apiKey.name}"? This action cannot
            be undone and any applications using this key will immediately lose access.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Revoking...' : 'Revoke'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
