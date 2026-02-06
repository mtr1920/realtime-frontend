/**
 * RecordingIndicator Component
 *
 * Visual indicator showing recording status with pulsing red dot and duration.
 */

import { Circle } from 'lucide-react';
import { useRecordingStatus } from '../hooks/useRecordingStatus';
import { useReducedMotion } from '@/shared/theme/useReducedMotion';
import { cn } from '@/shared/lib/utils';

export interface RecordingIndicatorProps {
  /** Additional class names */
  className?: string;
  /** Show duration counter */
  showDuration?: boolean;
}

/**
 * Recording indicator with pulsing red dot and duration
 *
 * @example
 * ```tsx
 * <RecordingIndicator showDuration />
 * ```
 */
export function RecordingIndicator({
  className,
  showDuration = true,
}: RecordingIndicatorProps) {
  const { isRecording, isRecordingInProgress, formattedDuration, status } =
    useRecordingStatus();
  const prefersReducedMotion = useReducedMotion();

  // Don't render if not recording
  if (!isRecordingInProgress) {
    return null;
  }

  const isStarting = status === 'pending';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        'bg-red-500/10 text-red-600 dark:text-red-400',
        'border border-red-500/20',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={
        isStarting
          ? 'Recording starting'
          : `Recording in progress, duration ${formattedDuration}`
      }
    >
      {/* Pulsing red dot */}
      <span className="relative flex h-3 w-3">
        {/* Pulse ring - only animate if not reduced motion */}
        {!prefersReducedMotion && isRecording && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75',
              'motion-safe:animate-ping'
            )}
          />
        )}
        {/* Solid dot */}
        <Circle
          className={cn(
            'relative inline-flex h-3 w-3 fill-current',
            isRecording ? 'text-red-500' : 'text-red-400'
          )}
        />
      </span>

      {/* Status text */}
      <span className="text-sm font-medium">
        {isStarting ? 'Starting...' : 'REC'}
      </span>

      {/* Duration counter */}
      {showDuration && isRecording && (
        <span className="text-sm font-mono tabular-nums">{formattedDuration}</span>
      )}
    </div>
  );
}
