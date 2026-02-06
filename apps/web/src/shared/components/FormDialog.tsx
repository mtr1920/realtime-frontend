/**
 * FormDialog Component
 *
 * A reusable dialog wrapper for forms with consistent styling.
 * Provides header, content area, and optional footer.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui';

export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Form content */
  children: React.ReactNode;
  /** Optional custom footer (defaults to none) */
  footer?: React.ReactNode;
  /** Optional icon to show in title */
  icon?: React.ReactNode;
  /** Optional className for DialogContent */
  className?: string;
}

/**
 * FormDialog provides a consistent form dialog wrapper.
 *
 * @example
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create User"
 *   description="Enter user details below."
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <SubmitButton isLoading={isPending}>Create</SubmitButton>
 *     </>
 *   }
 * >
 *   <form onSubmit={handleSubmit}>...</form>
 * </FormDialog>
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  icon,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
