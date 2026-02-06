/**
 * SecretRevealDialog Component
 * Dialog for displaying and rotating webhook secrets.
 */

import { useState, useCallback } from 'react';
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
import { useRotateSecret } from '../hooks/useRotateSecret';
import { showSuccess, showInfo, handleError } from '@/shared/errors';
import type { Webhook } from '../types/webhooks.types';

interface SecretRevealDialogProps {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecretRevealDialog({
  webhook,
  open,
  onOpenChange,
}: SecretRevealDialogProps) {
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const { rotateSecret, isLoading } = useRotateSecret({
    onSuccess: (response) => {
      setNewSecret(response.secret);
      setConfirmRotate(false);
      showSuccess('Secret rotated. Copy the new secret below.');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to rotate secret' });
    },
  });

  const handleRotate = useCallback(async () => {
    if (!webhook) return;
    await rotateSecret(webhook.id);
  }, [webhook, rotateSecret]);

  const handleCopySecret = useCallback(() => {
    if (newSecret) {
      navigator.clipboard.writeText(newSecret);
      showInfo('Secret copied to clipboard');
    }
  }, [newSecret]);

  const handleClose = useCallback(() => {
    setNewSecret(null);
    setConfirmRotate(false);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {newSecret ? 'New Secret Generated' : 'Rotate Webhook Secret'}
          </DialogTitle>
          <DialogDescription>
            {newSecret
              ? 'Copy the new webhook secret below. It will only be shown once.'
              : `Rotate the signing secret for "${webhook.name}".`}
          </DialogDescription>
        </DialogHeader>

        {newSecret ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newSecret">New Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="newSecret"
                  value={newSecret}
                  readOnly
                  className="font-mono"
                  aria-label="New webhook secret"
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
        ) : confirmRotate ? (
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">
                Are you sure you want to rotate this secret? The current secret will be invalidated
                immediately and any requests using it will fail.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmRotate(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRotate}
                disabled={isLoading}
              >
                {isLoading ? 'Rotating...' : 'Rotate Secret'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rotating the secret will invalidate the current signing secret. You'll need to update
              your webhook endpoint to use the new secret.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmRotate(true)}>
                Rotate Secret
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
