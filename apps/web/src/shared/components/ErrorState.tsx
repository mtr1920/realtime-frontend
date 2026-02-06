/**
 * ErrorState Component
 *
 * Reusable component for displaying error states with retry action.
 * Use for consistent error handling across components.
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface ErrorStateProps {
  /** Error title (defaults to "Something went wrong") */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS class */
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center py-8 text-center',
        className
      )}
      role="alert"
    >
      <AlertCircle
        className="mb-3 h-12 w-12 text-destructive opacity-70"
        aria-hidden="true"
      />
      <h3 className="text-lg font-medium text-destructive">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
