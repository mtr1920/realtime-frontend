/**
 * ResharePrompt Component
 *
 * Modal shown when user stops screen sharing and re-share is required.
 * Prompts user to resume screen sharing or continue without it.
 */

import { forwardRef, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Alert, AlertDescription } from '@/shared/ui';
import { MonitorOff, Monitor, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ResharePromptProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Whether screen share is strictly required (no dismiss option) */
  isRequired?: boolean;
  /** Whether screen share request is in progress */
  isLoading?: boolean;
  /** Whether entire screen (not tab/window) is required */
  requireEntireScreen?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback when user clicks to re-share */
  onReshare: () => void;
  /** Callback when user dismisses the prompt (if allowed) */
  onDismiss?: () => void;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const ResharePrompt = forwardRef<HTMLDivElement, ResharePromptProps>(
  function ResharePrompt(
    {
      isOpen,
      isRequired = false,
      isLoading = false,
      requireEntireScreen = false,
      error,
      onReshare,
      onDismiss,
      className,
    },
    ref
  ) {
    const reshareButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-focus re-share button when modal opens
    useEffect(() => {
      if (!isOpen) return;

      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        reshareButtonRef.current?.focus();
      });

      return () => cancelAnimationFrame(rafId);
    }, [isOpen]);

    return (
      <Dialog open={isOpen} onOpenChange={!isRequired ? (open) => !open && onDismiss?.() : undefined}>
        <DialogContent
          ref={ref}
          className={cn(
            isRequired && '[&>button]:hidden',
            className
          )}
          onPointerDownOutside={isRequired ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={isRequired ? (e) => e.preventDefault() : undefined}
          aria-labelledby="reshare-title"
          aria-describedby="reshare-description"
          aria-modal="true"
          role={isRequired ? 'alertdialog' : 'dialog'}
        >
          {/* Live region for screen readers when required */}
          {isRequired && (
            <div role="status" aria-live="polite" className="sr-only">
              Screen sharing has stopped. You must resume sharing to continue this session.
            </div>
          )}

          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 mb-4">
              <MonitorOff className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>

            <DialogTitle id="reshare-title" className="text-center">
              Screen Share Stopped
            </DialogTitle>

            <DialogDescription id="reshare-description" className="text-center">
              {isRequired ? (
                <>
                  Screen sharing is required to continue this session.
                  Please resume sharing your screen.
                </>
              ) : (
                <>
                  Your screen sharing has ended. Would you like to resume sharing?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Required Warning */}
            {isRequired && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You cannot continue participating in this session without sharing
                  your screen. This is a compliance requirement.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Entire Screen Reminder */}
            {requireEntireScreen && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Remember to select &quot;Entire Screen&quot; when prompted.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className={cn('gap-2', isRequired ? 'sm:justify-center' : 'sm:justify-end')}>
            {!isRequired && onDismiss && (
              <Button
                type="button"
                variant="outline"
                onClick={onDismiss}
                disabled={isLoading}
              >
                Continue Without Sharing
              </Button>
            )}
            <Button
              ref={reshareButtonRef}
              onClick={onReshare}
              disabled={isLoading}
              size={isRequired ? 'lg' : 'default'}
              className={isRequired ? 'min-w-[200px]' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Monitor className="mr-2 h-4 w-4" />
                  Resume Sharing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
