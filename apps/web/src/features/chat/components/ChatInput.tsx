/**
 * ChatInput Component
 *
 * Text input for composing and sending chat messages.
 * Includes character count and validation feedback.
 */

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { CHAT_CONFIG } from '../types';

// =============================================================================
// Types
// =============================================================================

interface ChatInputProps {
  /** Callback when a message is submitted */
  onSend: (content: string) => void;
  /** Whether sending is in progress */
  isSending?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ChatInput({
  onSend,
  isSending = false,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;

    // Check length before submitting
    if (trimmed.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
      return; // Let the hook handle the error
    }

    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();
  }, [value, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Single-line input - Enter submits
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isDisabled = disabled || isSending;
  const charCount = value.length;
  const isNearLimit = charCount > CHAT_CONFIG.MAX_MESSAGE_LENGTH * 0.9;
  const isOverLimit = charCount > CHAT_CONFIG.MAX_MESSAGE_LENGTH;
  const canSend = value.trim().length > 0 && !isDisabled && !isOverLimit;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className={cn('flex-1', isOverLimit && 'border-destructive')}
          aria-label="Chat message input"
          aria-invalid={isOverLimit}
          aria-describedby={isNearLimit ? 'char-count' : undefined}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      {isNearLimit && (
        <p
          id="char-count"
          className={cn(
            'text-xs text-right',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {charCount}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
        </p>
      )}
    </div>
  );
}

ChatInput.displayName = 'ChatInput';
