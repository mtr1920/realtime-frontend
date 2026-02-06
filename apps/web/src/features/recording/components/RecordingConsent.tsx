/**
 * RecordingConsent Component
 *
 * Modal dialog for obtaining recording consent before joining a session.
 */

import { Video, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface RecordingConsentProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when user accepts consent */
  onAccept: () => void;
  /** Called when user declines consent */
  onDecline: () => void;
  /** Session title for context */
  sessionTitle?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Recording consent modal
 *
 * @example
 * ```tsx
 * <RecordingConsent
 *   open={showConsent}
 *   onAccept={handleAccept}
 *   onDecline={handleDecline}
 *   sessionTitle="Team Meeting"
 * />
 * ```
 */
export function RecordingConsent({
  open,
  onAccept,
  onDecline,
  sessionTitle,
  className,
}: RecordingConsentProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent
        className={cn('sm:max-w-md', className)}
        aria-describedby="recording-consent-description"
      >
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <Video className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center">Recording Notice</DialogTitle>
          <DialogDescription
            id="recording-consent-description"
            className="text-center"
          >
            {sessionTitle
              ? `The session "${sessionTitle}" will be recorded.`
              : 'This session will be recorded.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">What will be recorded:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                  <li>Audio from all participants</li>
                  <li>Video from all participants</li>
                  <li>Screen shares when active</li>
                  <li>AI assistant interactions</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            By continuing, you consent to being recorded during this session.
            The recording may be used for review, training, or compliance
            purposes.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto"
          >
            Decline & Leave
          </Button>
          <Button onClick={onAccept} className="w-full sm:w-auto">
            I Consent & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
