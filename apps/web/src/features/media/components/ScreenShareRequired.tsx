/**
 * ScreenShareRequired Component
 *
 * Blocking modal shown when screen share is required but not active.
 * Guides users through enabling screen share to participate in session.
 */

import { forwardRef } from 'react';
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
import { Monitor, AlertTriangle, Loader2, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ScreenShareRequiredProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Whether screen share request is in progress */
  isLoading?: boolean;
  /** Whether permission was denied */
  permissionDenied?: boolean;
  /** Whether entire screen (not tab/window) is required */
  requireEntireScreen?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback when user clicks share screen */
  onRequestShare: () => void;
  /** Callback to clear error state */
  onClearError?: () => void;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const ScreenShareRequired = forwardRef<HTMLDivElement, ScreenShareRequiredProps>(
  function ScreenShareRequired(
    {
      isOpen,
      isLoading = false,
      permissionDenied = false,
      requireEntireScreen = false,
      error,
      onRequestShare,
      onClearError,
      className,
    },
    ref
  ) {
    return (
      <Dialog open={isOpen}>
        <DialogContent
          ref={ref}
          className={cn('[&>button]:hidden', className)}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          aria-labelledby="screen-share-title"
          aria-describedby="screen-share-description"
          aria-modal="true"
          role="alertdialog"
        >
          {/* Live region for screen readers */}
          <div role="status" aria-live="polite" className="sr-only">
            Screen sharing is required to continue this session. This dialog cannot be closed.
          </div>

          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Monitor className="h-7 w-7 text-primary" />
            </div>

            <DialogTitle id="screen-share-title" className="text-center">
              Screen Share Required
            </DialogTitle>

            <DialogDescription id="screen-share-description" className="text-center">
              This session requires you to share your screen to participate.
              {requireEntireScreen && (
                <span className="block mt-1 font-medium">
                  Please share your entire screen (not a specific tab or window).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Screen sharing helps ensure session integrity and allows observers
                to monitor the session. Your privacy is protected according to the
                session&apos;s compliance policy.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Permission Denied Help */}
            {permissionDenied && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 p-4">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  How to enable screen sharing:
                </h4>
                <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                  <li>Click the lock icon in your browser&apos;s address bar</li>
                  <li>Find &quot;Screen sharing&quot; or &quot;Camera&quot; permissions</li>
                  <li>Change the setting to &quot;Allow&quot;</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>
            )}

            {/* Entire Screen Requirement Info */}
            {requireEntireScreen && !error && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Entire screen required
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  When prompted, select &quot;Entire Screen&quot; or &quot;Monitor&quot; option
                  instead of a specific window or browser tab.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={onRequestShare}
              disabled={isLoading}
              size="lg"
              className="min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Monitor className="mr-2 h-4 w-4" />
                  Share Screen
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Clear error link */}
          {error && onClearError && (
            <div className="text-center">
              <button
                type="button"
                onClick={onClearError}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Dismiss error and try again
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);
