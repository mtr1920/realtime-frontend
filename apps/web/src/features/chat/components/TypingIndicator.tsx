/**
 * TypingIndicator Component
 *
 * Animated dots showing when someone is typing.
 */

import { memo } from 'react';
import { cn } from '@/shared/lib/utils';

interface TypingIndicatorProps {
  /** Names of people typing */
  typingUsers: string[];
  /** Additional class name */
  className?: string;
}

export const TypingIndicator = memo(function TypingIndicator({
  typingUsers,
  className,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers.length} people are typing`;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Animated dots */}
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full bg-muted-foreground/60',
              'motion-safe:animate-bounce-dots'
            )}
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <span>{typingText}</span>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
