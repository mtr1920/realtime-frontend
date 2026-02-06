/**
 * TranscriptEntry Component
 *
 * Displays a single transcript turn with speaker info and timestamp.
 * Uses configuration-driven role colors from session config.
 */

import { useMemo } from 'react';
import { useRoleConfig } from '@/features/sessions';
import { cn } from '@/shared/lib/utils';
import type { TranscriptTurn } from '../types/transcript.types';

export interface TranscriptEntryProps {
  /** Transcript turn data */
  turn: TranscriptTurn;
  /** Show timestamp */
  showTimestamp?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Transcript entry display
 *
 * @example
 * ```tsx
 * <TranscriptEntry turn={turn} showTimestamp />
 * ```
 */
export function TranscriptEntry({
  turn,
  showTimestamp = true,
  className,
}: TranscriptEntryProps) {
  const { getRoleColor } = useRoleConfig();

  const formattedTime = useMemo(() => {
    return new Date(turn.startedAt).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [turn.startedAt]);

  const speakerColor = useMemo(
    () => getRoleColor(turn.speakerRole),
    [getRoleColor, turn.speakerRole]
  );

  return (
    <div
      className={cn(
        'group relative py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors',
        !turn.isFinal && 'opacity-70',
        className
      )}
    >
      {/* Header with speaker and timestamp */}
      <div className="flex items-center gap-2 text-sm mb-1">
        <span className={cn('font-medium capitalize', speakerColor)}>
          {turn.speakerName || turn.speakerRole}
        </span>
        {showTimestamp && (
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        )}
        {!turn.isFinal && (
          <span className="text-xs text-muted-foreground italic">
            (transcribing...)
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed">{turn.content}</p>
    </div>
  );
}
