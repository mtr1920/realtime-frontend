/**
 * ChatMessage Component
 *
 * Displays a single chat message with sender info and timestamp.
 */

import { memo } from 'react';
import { cn } from '@/shared/lib/utils';
import type { ChatMessage as ChatMessageType } from '../types';

// =============================================================================
// Types
// =============================================================================

interface ChatMessageProps {
  message: ChatMessageType;
  /** Whether to show the sender name (for consecutive messages) */
  showSender?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// Component
// =============================================================================

export const ChatMessage = memo(function ChatMessage({
  message,
  showSender = true,
}: ChatMessageProps) {
  const isOwn = message.isOwn;

  return (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[80%]',
        isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      {/* Sender name */}
      {showSender && !isOwn && (
        <span className="text-xs text-muted-foreground px-1">
          {message.senderName}
          {message.isPrivate && (
            <span className="ml-1 text-primary">(private)</span>
          )}
        </span>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'rounded-2xl px-4 py-2 text-sm',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-muted-foreground px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
