/**
 * AIControls Component - Controls for AI interaction
 */

import { forwardRef, useCallback, useEffect, useState } from 'react';
import { Mic, MicOff, Hand, Volume2, Loader2 } from 'lucide-react';
import { usePermissions } from '@/features/auth';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { AISessionState, AIInputMode } from '../types/session.types';
import { PushToTalkButton, ToggleSpeakButton } from './AIControlsButtons';
import { AudioLevelMeter, TurnIndicator } from './AIControlsIndicators';

// =============================================================================
// Types
// =============================================================================

interface AIControlsProps {
  state: AISessionState;
  inputMode: AIInputMode;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;
  audioLevel: number;
  isMuted?: boolean;
  useToggleMode?: boolean;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
  onInterrupt: () => void;
  onToggleMute?: () => void;
  className?: string;
}

// =============================================================================
// AIControls Component
// =============================================================================

export const AIControls = forwardRef<HTMLDivElement, AIControlsProps>(
  ({ state, inputMode, isUserSpeaking, isAISpeaking, audioLevel, isMuted = false, useToggleMode = false, onStartSpeaking, onStopSpeaking, onInterrupt, onToggleMute, className }, ref) => {
    const [isHolding, setIsHolding] = useState(false);
    const { hasPermission } = usePermissions();
    const canUseAI = hasPermission('canUseAI');

    const isDisabled = !canUseAI || state === 'idle' || state === 'starting' || state === 'ending' || state === 'error';
    const canSpeak = canUseAI && state === 'ready' && !isAISpeaking;
    const canInterrupt = isAISpeaking;

    const handleToggle = useCallback(() => {
      if (isUserSpeaking) onStopSpeaking();
      else if (canSpeak) onStartSpeaking();
    }, [isUserSpeaking, canSpeak, onStartSpeaking, onStopSpeaking]);

    const handlePressStart = useCallback(() => {
      if (canSpeak && inputMode === 'push_to_talk' && !useToggleMode) {
        setIsHolding(true);
        onStartSpeaking();
      }
    }, [canSpeak, inputMode, useToggleMode, onStartSpeaking]);

    const handlePressEnd = useCallback(() => {
      if (isHolding && inputMode === 'push_to_talk' && !useToggleMode) {
        setIsHolding(false);
        onStopSpeaking();
      }
    }, [isHolding, inputMode, useToggleMode, onStopSpeaking]);

    // Keyboard support for push-to-talk
    useEffect(() => {
      if (inputMode !== 'push_to_talk') return;
      const controller = new AbortController();

      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        const isTextInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable || target?.getAttribute?.('contenteditable') === 'true';
        if (e.code === 'Space' && !e.repeat && !isTextInput) {
          e.preventDefault();
          if (useToggleMode) handleToggle();
          else if (canSpeak && !isHolding) handlePressStart();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (!useToggleMode && e.code === 'Space' && isHolding) {
          e.preventDefault();
          handlePressEnd();
        }
      };

      window.addEventListener('keydown', handleKeyDown, { signal: controller.signal });
      window.addEventListener('keyup', handleKeyUp, { signal: controller.signal });
      return () => controller.abort();
    }, [inputMode, canSpeak, isHolding, useToggleMode, handleToggle, handlePressStart, handlePressEnd]);

    return (
      <div ref={ref} className={cn('flex flex-col items-center gap-4', className)}>
        <TurnIndicator state={state} isUserSpeaking={isUserSpeaking} isAISpeaking={isAISpeaking} useToggleMode={useToggleMode} />

        <div className="flex items-center gap-4">
          {onToggleMute && (
            <Button variant="ghost" size="icon" onClick={onToggleMute} disabled={isDisabled} aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}>
              {isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}

          {inputMode === 'push_to_talk' && useToggleMode && (
            <ToggleSpeakButton isActive={isUserSpeaking} isDisabled={!canSpeak} onToggle={handleToggle} />
          )}

          {inputMode === 'push_to_talk' && !useToggleMode && (
            <PushToTalkButton isActive={isUserSpeaking} isDisabled={!canSpeak} audioLevel={audioLevel} onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd} />
          )}

          {inputMode === 'voice_activated' && (
            <div
              className={cn('h-16 w-16 rounded-full flex items-center justify-center', isUserSpeaking ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground')}
              role="status"
              aria-label={state === 'processing' ? 'Processing your speech' : isUserSpeaking ? 'Listening to your speech' : 'Ready for voice input'}
            >
              {state === 'processing' ? <Loader2 className="h-8 w-8 motion-safe:animate-spin" aria-hidden="true" /> : <Mic className={cn('h-8 w-8', isUserSpeaking && 'motion-safe:animate-pulse')} aria-hidden="true" />}
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={onInterrupt} disabled={!canInterrupt} aria-label="Interrupt AI" className={cn(canInterrupt && 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10')}>
            <Hand className="h-5 w-5" />
          </Button>
        </div>

        {isUserSpeaking && <AudioLevelMeter level={audioLevel} isActive={isUserSpeaking} className="w-32" />}

        {isAISpeaking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Volume2 className="h-4 w-4 motion-safe:motion-safe:animate-pulse text-primary" />
            <span>AI is speaking</span>
          </div>
        )}

        {inputMode === 'push_to_talk' && canSpeak && !isUserSpeaking && (
          <div className="text-xs text-muted-foreground">
            {useToggleMode ? (
              <>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd> or button to speak</>
            ) : (
              <>Hold <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd> or button to speak</>
            )}
          </div>
        )}
      </div>
    );
  }
);

AIControls.displayName = 'AIControls';

// =============================================================================
// Compact Controls (for toolbar)
// =============================================================================

interface CompactAIControlsProps {
  state: AISessionState;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;
  onStartSpeaking: () => void;
  onStopSpeaking: () => void;
  onInterrupt: () => void;
  className?: string;
}

export function CompactAIControls({ state, isUserSpeaking, isAISpeaking, onStartSpeaking, onStopSpeaking, onInterrupt, className }: CompactAIControlsProps) {
  const canSpeak = state === 'ready' && !isAISpeaking;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant={isUserSpeaking ? 'default' : 'ghost'}
        size="sm"
        onMouseDown={canSpeak ? onStartSpeaking : undefined}
        onMouseUp={isUserSpeaking ? onStopSpeaking : undefined}
        onMouseLeave={isUserSpeaking ? onStopSpeaking : undefined}
        disabled={!canSpeak && !isUserSpeaking}
        className={cn(isUserSpeaking && 'bg-blue-500 hover:bg-blue-600')}
      >
        <Mic className="h-4 w-4 mr-1" />
        {isUserSpeaking ? 'Speaking...' : 'Talk'}
      </Button>

      {isAISpeaking && (
        <Button variant="ghost" size="sm" onClick={onInterrupt} className="text-orange-500">
          <Hand className="h-4 w-4 mr-1" />
          Interrupt
        </Button>
      )}
    </div>
  );
}
