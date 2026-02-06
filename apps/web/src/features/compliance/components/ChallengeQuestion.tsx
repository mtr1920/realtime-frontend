/**
 * ChallengeQuestion Component
 *
 * Displays a question-based challenge with selectable options.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export interface ChallengeQuestionProps {
  /** Challenge question/prompt */
  prompt: string;
  /** Available options */
  options: string[];
  /** Called when an option is selected */
  onSubmit: (response: string) => void;
  /** Whether submission is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Question-based challenge display
 *
 * @example
 * ```tsx
 * <ChallengeQuestion
 *   prompt="What is the capital of France?"
 *   options={["London", "Paris", "Berlin", "Madrid"]}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function ChallengeQuestion({
  prompt,
  options,
  onSubmit,
  disabled = false,
  className,
}: ChallengeQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = useCallback((option: string) => {
    if (!disabled) {
      setSelectedOption(option);
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (selectedOption) {
      onSubmit(selectedOption);
    }
  }, [selectedOption, onSubmit]);

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-base font-medium text-foreground">{prompt}</p>

      <div className="space-y-2" role="radiogroup" aria-label={prompt}>
        {options.map((option, index) => (
          <button
            key={`item-${index}`}
            type="button"
            onClick={() => handleSelect(option)}
            disabled={disabled}
            className={cn(
              'w-full p-4 text-left rounded-lg border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              selectedOption === option
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-border bg-background hover:border-primary/50 hover:bg-muted/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            role="radio"
            aria-checked={selectedOption === option}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border-2',
                  selectedOption === option
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                )}
              >
                {selectedOption === option && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              <span className="text-sm">{option}</span>
            </span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={disabled || !selectedOption}
        className="w-full"
      >
        Submit Answer
      </Button>
    </div>
  );
}
