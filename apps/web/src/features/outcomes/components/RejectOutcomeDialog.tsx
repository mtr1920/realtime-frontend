/**
 * RejectOutcomeDialog Component
 * Dialog for rejecting an outcome with a note.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { rejectOutcomeSchema, type RejectOutcomeFormData } from '../schemas/outcomes.schema';
import type { Outcome } from '../types/outcomes.types';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

interface RejectOutcomeDialogProps {
  outcome: Outcome | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
  isLoading?: boolean;
}

export function RejectOutcomeDialog({
  outcome,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RejectOutcomeDialogProps) {
  const form = useForm({
    resolver: zodResolver(rejectOutcomeSchema),
    defaultValues: {
      note: '',
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const onFormSubmit: SubmitHandler<FieldValues> = (data) => {
    const formData = data as RejectOutcomeFormData;
    onConfirm(formData.note);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  if (!outcome) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Outcome</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this outcome. The session owner
            will be notified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Rejection Note</Label>
            <textarea
              id="note"
              {...register('note')}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Explain why this outcome is being rejected..."
              disabled={isLoading}
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? 'note-error' : undefined}
            />
            {errors.note && (
              <p id="note-error" className="text-sm text-destructive">
                {errors.note.message as string}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Rejecting...' : 'Reject Outcome'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
