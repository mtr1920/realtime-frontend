/**
 * SubmitButton Component
 *
 * A button component that handles loading states with spinner animation.
 * Consolidates the common loading button pattern used throughout the app.
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/shared/ui';

export interface SubmitButtonProps extends ButtonProps {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to show when loading (defaults to children if not provided) */
  loadingText?: string;
}

/**
 * SubmitButton wraps Button with loading state handling.
 *
 * @example
 * <SubmitButton isLoading={isPending}>Save</SubmitButton>
 *
 * @example
 * <SubmitButton isLoading={isPending} loadingText="Saving...">
 *   Save Changes
 * </SubmitButton>
 */
export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || isLoading} {...props}>
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';
