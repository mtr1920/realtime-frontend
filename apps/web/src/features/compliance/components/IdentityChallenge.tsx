/**
 * IdentityChallenge Component
 *
 * Modal for identity verification challenges with countdown timer.
 */

import { useCallback, useMemo } from 'react';
import { ShieldQuestion, Clock, AlertTriangle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ChallengeQuestion } from './ChallengeQuestion';
import type { IdentityVerification, IdentityVerificationStatus } from '../types/challenge.types';

export interface IdentityChallengeProps {
  /** Active verification */
  verification: IdentityVerification;
  /** Verification status */
  status: IdentityVerificationStatus;
  /** Remaining time in seconds */
  remainingSeconds: number;
  /** Called when response is submitted */
  onSubmit: (response: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Identity verification challenge modal
 *
 * @example
 * ```tsx
 * {activeVerification && (
 *   <IdentityChallenge
 *     verification={activeVerification}
 *     status={status}
 *     remainingSeconds={remainingSeconds}
 *     onSubmit={submitResponse}
 *   />
 * )}
 * ```
 */
export function IdentityChallenge({
  verification,
  status,
  remainingSeconds,
  onSubmit,
  className,
}: IdentityChallengeProps) {
  const isExpired = status === 'expired';
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  // Calculate progress percentage
  const progressValue = useMemo(() => {
    if (verification.timeoutSeconds === 0) return 100;
    return (remainingSeconds / verification.timeoutSeconds) * 100;
  }, [remainingSeconds, verification.timeoutSeconds]);

  // Get urgency level based on remaining time
  const urgencyLevel = useMemo(() => {
    if (remainingSeconds <= 10) return 'critical';
    if (remainingSeconds <= 30) return 'warning';
    return 'normal';
  }, [remainingSeconds]);

  // Format time display
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const handleSubmit = useCallback(
    (response: string) => {
      if (isActive) {
        onSubmit(response);
      }
    },
    [isActive, onSubmit]
  );

  return (
    <Dialog open={true}>
      <DialogContent
        className={cn(
          'sm:max-w-lg [&>button]:hidden', // Hide close button
          urgencyLevel === 'critical' && 'border-red-500',
          className
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            {isCompleted ? (
              <Check className="h-7 w-7 text-green-600" />
            ) : isExpired ? (
              <AlertTriangle className="h-7 w-7 text-red-600" />
            ) : (
              <ShieldQuestion className="h-7 w-7 text-primary" />
            )}
          </div>

          <DialogTitle className="text-center">
            {isCompleted
              ? 'Verification Complete'
              : isExpired
              ? 'Verification Expired'
              : 'Identity Verification Required'}
          </DialogTitle>

          <DialogDescription className="text-center">
            {isCompleted
              ? 'Your identity has been verified. You may continue.'
              : isExpired
              ? 'The verification time limit has been exceeded.'
              : 'Please complete this verification to continue your session.'}
          </DialogDescription>
        </DialogHeader>

        {/* Timer Section */}
        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time remaining</span>
              </div>
              <span
                className={cn(
                  'font-mono font-medium tabular-nums',
                  urgencyLevel === 'critical' && 'text-red-600 motion-safe:animate-pulse',
                  urgencyLevel === 'warning' && 'text-amber-600'
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                {formattedTime}
              </span>
            </div>
            <Progress
              value={progressValue}
              className={cn(
                'h-2',
                urgencyLevel === 'critical' && '[&>div]:bg-red-500',
                urgencyLevel === 'warning' && '[&>div]:bg-amber-500'
              )}
            />
          </div>
        )}

        {/* Challenge Content */}
        <div className="py-4">
          {isCompleted ? (
            <div className="text-center text-green-600">
              <Check className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Response submitted successfully</p>
            </div>
          ) : isExpired ? (
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">
                Please wait for a session moderator to assist you.
              </p>
            </div>
          ) : verification.type === 'challenge_question' && verification.options ? (
            <ChallengeQuestion
              prompt={verification.prompt}
              options={verification.options}
              onSubmit={handleSubmit}
              disabled={!isActive}
            />
          ) : (
            // Biometric or other verification types - show prompt
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{verification.prompt}</p>
              {/* Biometric verifications would have additional UI here */}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
