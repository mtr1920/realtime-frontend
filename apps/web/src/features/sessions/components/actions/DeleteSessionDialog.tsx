/**
 * Delete Session Dialog
 * Confirmation dialog requiring session ID typing for permanent deletion.
 */

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  Button,
  Input,
  Label,
} from '@/shared/ui';

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  externalId?: string;
  onConfirm: () => Promise<void>;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  sessionId,
  externalId,
  onConfirm,
}: DeleteSessionDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayId = externalId || sessionId.slice(0, 8);
  const isConfirmed = confirmText === displayId;

  const handleConfirm = async () => {
    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setConfirmText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setConfirmText('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Session Permanently
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to permanently delete session{' '}
                <span className="font-mono font-medium text-foreground">{displayId}</span>.
              </p>

              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/50">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <p className="font-medium">This action is permanent and cannot be undone.</p>
                  <p>All associated data will be deleted:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>Session metadata and configuration</li>
                    <li>Participant records</li>
                    <li>Activity logs and events</li>
                    <li>Recordings (if any)</li>
                    <li>Outcomes and evaluations</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-mono font-medium">{displayId}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            placeholder={displayId}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
