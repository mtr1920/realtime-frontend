/**
 * InactivityWarning Component
 *
 * Modal warning for user inactivity with countdown.
 */

import { useEffect, useRef } from 'react';
import { Clock, MousePointer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Progress,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface InactivityWarningProps {
  /** Whether the warning is open */
  isOpen: boolean;
  /** Seconds remaining before timeout */
  secondsRemaining: number;
  /** Total seconds in the countdown */
  totalSeconds?: number;
  /** Called when user confirms activity */
  onConfirm: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Inactivity warning modal with countdown
 *
 * @example
 * ```tsx
 * <InactivityWarning
 *   isOpen={isWarningActive}
 *   secondsRemaining={secondsRemaining}
 *   totalSeconds={30}
 *   onConfirm={resetTimer}
 * />
 * ```
 */
export function InactivityWarning({
  isOpen,
  secondsRemaining,
  totalSeconds = 30,
  onConfirm,
  className,
}: InactivityWarningProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isOpen]);

  const progressValue = (secondsRemaining / totalSeconds) * 100;
  const isUrgent = secondsRemaining <= 10;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className={cn('[&>button]:hidden', className)}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-4">
            <div
              className={cn(
                'rounded-full p-4',
                isUrgent
                  ? 'bg-red-100 dark:bg-red-950'
                  : 'bg-amber-100 dark:bg-amber-950'
              )}
            >
              <Clock
                className={cn(
                  'h-8 w-8',
                  isUrgent
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              />
            </div>
          </div>

          <DialogTitle className="text-center text-xl">
            Are you still there?
          </DialogTitle>

          <DialogDescription className="text-center">
            We haven&apos;t detected any activity. Your session will be marked as
            inactive if you don&apos;t respond.
          </DialogDescription>
        </DialogHeader>

        {/* Countdown */}
        <div className="my-6 space-y-3">
          <div className="flex items-center justify-center">
            <span
              className={cn(
                'text-5xl font-bold tabular-nums',
                isUrgent ? 'text-red-600 dark:text-red-400' : 'text-foreground'
              )}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
            >
              {secondsRemaining}
            </span>
            <span className="ml-2 text-muted-foreground">seconds</span>
          </div>

          <Progress
            value={progressValue}
            className={cn(
              'h-2',
              isUrgent && '[&>div]:bg-red-600 dark:[&>div]:bg-red-400'
            )}
          />
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            ref={buttonRef}
            onClick={onConfirm}
            size="lg"
            className="min-w-[200px]"
          >
            <MousePointer className="h-4 w-4 mr-2" />
            I&apos;m Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
