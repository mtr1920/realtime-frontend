/**
 * AI Controls Buttons - Push-to-talk and toggle speak buttons
 */

import { forwardRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Push-to-Talk Button
// =============================================================================

export interface PushToTalkButtonProps {
  isActive: boolean;
  isDisabled: boolean;
  audioLevel: number;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  className?: string;
}

export const PushToTalkButton = forwardRef<HTMLButtonElement, PushToTalkButtonProps>(
  ({ isActive, isDisabled, audioLevel, onMouseDown, onMouseUp, onTouchStart, onTouchEnd, className }, ref) => {
    const glowIntensity = isActive ? Math.min(1, audioLevel * 3) : 0;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          'relative h-16 w-16 rounded-full transition-all duration-150',
          'flex items-center justify-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isActive ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-muted hover:bg-muted/80 text-muted-foreground',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={{
          boxShadow: isActive
            ? `0 0 ${20 + glowIntensity * 20}px ${glowIntensity * 10}px rgba(59, 130, 246, ${0.3 + glowIntensity * 0.3})`
            : undefined,
        }}
        aria-label={isActive ? 'Release to stop speaking' : 'Hold to speak'}
        aria-pressed={isActive}
      >
        {isActive ? <Mic className="h-8 w-8 motion-safe:animate-pulse" /> : <Mic className="h-8 w-8" />}
        {isActive && <div className="absolute inset-0 rounded-full border-4 border-blue-300 motion-safe:animate-ping opacity-50" />}
      </button>
    );
  }
);

PushToTalkButton.displayName = 'PushToTalkButton';

// =============================================================================
// Toggle Speak Button
// =============================================================================

export interface ToggleSpeakButtonProps {
  isActive: boolean;
  isDisabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function ToggleSpeakButton({ isActive, isDisabled, onToggle, className }: ToggleSpeakButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      variant={isActive ? 'destructive' : 'default'}
      onClick={onToggle}
      disabled={isDisabled && !isActive}
      className={cn('gap-2 min-w-[160px]', className)}
      aria-label={isActive ? 'Finish speaking' : 'Start speaking'}
      aria-pressed={isActive}
    >
      {isActive ? (
        <>
          <MicOff className="h-5 w-5" />
          Finish Speaking
        </>
      ) : (
        <>
          <Mic className="h-5 w-5" />
          Start Speaking
        </>
      )}
    </Button>
  );
}
