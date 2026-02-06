/**
 * ErrorAlert Component
 *
 * A consistent error display component using the Alert primitive.
 * Shows error messages in a visually distinct, accessible format.
 */

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, cn } from '@/shared/ui';

export interface ErrorAlertProps {
  /** The error message to display. If null/undefined, component renders nothing. */
  error: string | null | undefined;
  /** Optional additional className */
  className?: string;
  /** Optional title (defaults to none, just shows error message) */
  title?: string;
}

/**
 * ErrorAlert displays error messages in a consistent format.
 * Returns null if error is falsy.
 *
 * @example
 * <ErrorAlert error={submitError} />
 *
 * @example
 * <ErrorAlert
 *   error={error}
 *   title="Submission Failed"
 *   className="mt-4"
 * />
 */
export function ErrorAlert({ error, className, title }: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className={cn('flex items-start gap-2', className)}>
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <AlertDescription>
        {title && <span className="font-medium">{title}: </span>}
        {error}
      </AlertDescription>
    </Alert>
  );
}
