/**
 * ConfirmationDialog Component
 *
 * A reusable confirmation dialog for destructive or important actions.
 * Supports loading states and customizable variants.
 */

import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  Button,
} from '@/shared/ui';

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description - can be string or React node */
  description: React.ReactNode;
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Button variant (default: "default") */
  variant?: 'default' | 'destructive';
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Optional icon to show in title */
  icon?: React.ReactNode;
  /** Whether confirm button should be disabled */
  confirmDisabled?: boolean;
}

/**
 * ConfirmationDialog provides a consistent confirmation UI.
 *
 * @example
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item?"
 *   variant="destructive"
 *   isLoading={isDeleting}
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  icon,
  confirmDisabled = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {typeof description === 'string' ? <p>{description}</p> : description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
            )}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
