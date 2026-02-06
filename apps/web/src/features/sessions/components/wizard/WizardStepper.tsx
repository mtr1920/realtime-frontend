/**
 * WizardStepper Component
 *
 * Horizontal stepper with animated progress indicator.
 * Shows current step, completed steps, and remaining steps.
 */

import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardStepperProps {
  /** Array of step definitions */
  steps: WizardStep[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Called when a completed step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const WizardStepper = memo(function WizardStepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center" role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                index !== steps.length - 1 && 'pr-4 sm:pr-8'
              )}
            >
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-5 left-8 -right-4 sm:-right-4 h-0.5"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}

              {/* Step */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  'group relative flex flex-col items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step Circle */}
                <span
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full',
                    'transition-all duration-300',
                    isCompleted && [
                      'bg-primary text-primary-foreground',
                      'motion-safe:animate-check-bounce',
                    ],
                    isCurrent && [
                      'border-2 border-primary bg-background',
                      'ring-4 ring-primary/20',
                    ],
                    !isCompleted && !isCurrent && 'border-2 border-muted bg-background'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </span>

                {/* Step Label */}
                <span className="mt-2 flex flex-col items-center">
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-foreground',
                      !isCompleted && !isCurrent && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Progress Bar (Mobile) */}
      <div className="mt-4 sm:hidden">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </nav>
  );
});
