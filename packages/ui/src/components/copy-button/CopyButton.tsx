/**
 * CopyButton Component
 *
 * Button that copies text to clipboard with visual feedback.
 */

import { forwardRef, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, type ButtonProps } from '../button';
import { useClipboard } from '../../hooks';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Text to copy */
  value: string;
  /** Icon when not copied */
  icon?: ReactNode;
  /** Icon when copied */
  copiedIcon?: ReactNode;
  /** Text label when not copied */
  label?: string;
  /** Text label when copied */
  copiedLabel?: string;
  /** Called after successful copy */
  onCopied?: (value: string) => void;
  /** Duration to show copied state (ms) */
  timeout?: number;
}

// ============================================================================
// Component
// ============================================================================

export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      icon,
      copiedIcon,
      label,
      copiedLabel,
      onCopied,
      timeout = 2000,
      variant = 'ghost',
      size = 'sm',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { copy, copied } = useClipboard({ timeout });

    const handleClick = async () => {
      const success = await copy(value);
      if (success) {
        onCopied?.(value);
      }
    };

    const defaultIcon = icon ?? <Copy className="h-4 w-4" />;
    const defaultCopiedIcon = copiedIcon ?? <Check className="h-4 w-4" />;

    // If children provided, render them directly
    if (children) {
      return (
        <Button
          ref={ref}
          variant={variant}
          size={size}
          className={className}
          onClick={handleClick}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
          {...props}
        >
          {children}
        </Button>
      );
    }

    // Render icon-only or icon + label
    const showLabel = label || copiedLabel;

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          showLabel && 'gap-2',
          !showLabel && 'h-8 w-8 p-0',
          className
        )}
        onClick={handleClick}
        aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        {...props}
      >
        {copied ? defaultCopiedIcon : defaultIcon}
        {showLabel && (
          <span>{copied ? (copiedLabel ?? 'Copied!') : label}</span>
        )}
      </Button>
    );
  }
);
CopyButton.displayName = 'CopyButton';
