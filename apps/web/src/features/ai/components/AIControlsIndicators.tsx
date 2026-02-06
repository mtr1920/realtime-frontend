/**
 * AI Controls Indicators - Visual indicators for AI session state
 */

import { cn } from '@/shared/lib/utils';
import type { AISessionState } from '../types/session.types';

// =============================================================================
// Audio Level Meter
// =============================================================================

export interface AudioLevelMeterProps {
  level: number;
  isActive: boolean;
  className?: string;
}

export function AudioLevelMeter({ level, isActive, className }: AudioLevelMeterProps) {
  const normalizedLevel = Math.min(100, level * 200);

  return (
    <div className={cn('h-1 w-full bg-muted rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full transition-all duration-75 rounded-full',
          isActive ? 'bg-blue-500' : 'bg-muted-foreground/30'
        )}
        style={{ width: `${normalizedLevel}%` }}
      />
    </div>
  );
}

// =============================================================================
// Turn Indicator
// =============================================================================

export interface TurnIndicatorProps {
  state: AISessionState;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;
  useToggleMode?: boolean;
  className?: string;
}

export function TurnIndicator({ state, isUserSpeaking, isAISpeaking, useToggleMode = false, className }: TurnIndicatorProps) {
  let message = '';
  let color = 'text-muted-foreground';

  if (state === 'idle' || state === 'starting') {
    message = 'Waiting to connect...';
  } else if (state === 'ready') {
    message = useToggleMode ? 'Your turn - click to speak' : 'Your turn - hold to speak';
    color = 'text-green-500';
  } else if (isUserSpeaking) {
    message = 'Listening...';
    color = 'text-blue-500';
  } else if (state === 'processing') {
    message = 'Processing...';
    color = 'text-purple-500';
  } else if (isAISpeaking) {
    message = 'AI is speaking...';
    color = 'text-primary';
  } else if (state === 'error') {
    message = 'Connection error';
    color = 'text-destructive';
  }

  return (
    <div className={cn('text-sm font-medium text-center', color, className)} role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
