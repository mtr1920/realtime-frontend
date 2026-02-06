/**
 * WebhookDialog Component
 * Dialog wrapper for creating and editing webhooks.
 */

import { useCallback, useState } from 'react';
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
import { WebhookForm } from './WebhookForm';
import { useCreateWebhook } from '../hooks/useCreateWebhook';
import { useUpdateWebhook } from '../hooks/useUpdateWebhook';
import { showSuccess, handleError, showInfo } from '@/shared/errors';
import type { Webhook } from '../types/webhooks.types';
import type { CreateWebhookFormData, UpdateWebhookFormData } from '../schemas/webhooks.schema';

// =============================================================================
// Create Webhook Dialog
// =============================================================================

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWebhookDialog({ open, onOpenChange }: CreateWebhookDialogProps) {
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const { createWebhook, isLoading } = useCreateWebhook({
    onSuccess: (result) => {
      setNewSecret(result.secret);
      showSuccess('Webhook created successfully. Copy the secret below.');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to create webhook' });
    },
  });

  const handleSubmit = useCallback(
    async (data: CreateWebhookFormData | UpdateWebhookFormData) => {
      await createWebhook(data as CreateWebhookFormData);
    },
    [createWebhook]
  );

  const handleClose = useCallback(() => {
    setNewSecret(null);
    onOpenChange(false);
  }, [onOpenChange]);

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
            {newSecret ? 'Webhook Created' : 'Create Webhook'}
          </DialogTitle>
          <DialogDescription>
            {newSecret
              ? 'Copy the webhook secret below. It will only be shown once.'
              : 'Configure a new webhook to receive event notifications.'}
          </DialogDescription>
        </DialogHeader>

        {newSecret ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Webhook Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="secret"
                  value={newSecret}
                  readOnly
                  className="font-mono"
                  aria-label="Webhook secret"
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
          <WebhookForm
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isLoading={isLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Edit Webhook Dialog
// =============================================================================

interface EditWebhookDialogProps {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWebhookDialog({
  webhook,
  open,
  onOpenChange,
}: EditWebhookDialogProps) {
  const { updateWebhook, isLoading } = useUpdateWebhook({
    onSuccess: () => {
      onOpenChange(false);
      showSuccess('Webhook updated successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to update webhook' });
    },
  });

  const handleSubmit = useCallback(
    async (data: CreateWebhookFormData | UpdateWebhookFormData) => {
      if (!webhook) return;
      await updateWebhook({ id: webhook.id, data: data as UpdateWebhookFormData });
    },
    [webhook, updateWebhook]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
          <DialogDescription>
            Update the configuration for {webhook.name}.
          </DialogDescription>
        </DialogHeader>
        <WebhookForm
          webhook={webhook}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Delete Webhook Dialog
// =============================================================================

interface DeleteWebhookDialogProps {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteWebhookDialog({
  webhook,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteWebhookDialogProps) {
  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Webhook</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{webhook.name}"? This action cannot
            be undone and all delivery history will be lost.
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
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
