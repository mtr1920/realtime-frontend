/**
 * AIPanel Component
 *
 * Wrapper component for AI interaction in the session room sidebar.
 * Manages AI session lifecycle and renders controls + transcript.
 */

import { useCallback, useState } from 'react';
import { Play, Square, AlertCircle, Loader2 } from 'lucide-react';
import { Button, Alert, AlertDescription, ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionStore } from '@/shared/stores/session.store';
import { useAISession } from '../hooks/useAISession';
import { AIControls } from './AIControls';
import { AITranscript, type TranscriptEntry } from './AITranscript';
import type { AISessionCallbacks, AISessionState } from '../types/session.types';

// =============================================================================
// Types
// =============================================================================

interface AIPanelProps {
  /** Maximum height for transcript area */
  maxHeight?: string;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// AIPanel Component
// =============================================================================

export function AIPanel({ maxHeight = 'calc(100vh - 400px)', className }: AIPanelProps) {
  const localParticipantId = useSessionStore((state) => state.localParticipantId);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingTurnId, setStreamingTurnId] = useState<string | null>(null);

  // AI session callbacks
  const callbacks: AISessionCallbacks = {
    onStateChange: useCallback((newState: AISessionState) => {
      // Reset streaming when session ends or errors
      if (newState === 'idle' || newState === 'error') {
        setStreamingText('');
        setStreamingTurnId(null);
      }
    }, []),

    onTextDelta: useCallback((text: string, isFinal: boolean) => {
      if (isFinal) {
        // Finalize the streaming entry
        setStreamingText('');
        setStreamingTurnId(null);
      } else {
        setStreamingText((prev) => prev + text);
      }
    }, []),

    onTextComplete: useCallback((text: string) => {
      // Add completed AI response to transcript
      const entry: TranscriptEntry = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        text,
        timestamp: Date.now(),
        isStreaming: false,
      };
      setTranscriptEntries((prev) => [...prev, entry]);
      setStreamingText('');
      setStreamingTurnId(null);
    }, []),

    onAISpeaking: useCallback(() => {
      // Create streaming entry placeholder when AI starts
      const turnId = `streaming-${Date.now()}`;
      setStreamingTurnId(turnId);
    }, []),
  };

  // Initialize AI session hook
  const {
    state,
    isUserSpeaking,
    isAISpeaking,
    userAudioLevel,
    error,
    startSession,
    endSession,
    startSpeaking,
    stopSpeaking,
    interruptAI,
  } = useAISession({
    participantId: localParticipantId ?? '',
    inputMode: 'push_to_talk',
    callbacks,
  });

  // Track user speech for transcript
  const handleStartSpeaking = useCallback(async () => {
    await startSpeaking();
    // Add user speaking indicator
  }, [startSpeaking]);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    // Add user entry to transcript when done speaking
    const entry: TranscriptEntry = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      text: '(Speech input)',
      timestamp: Date.now(),
      isStreaming: false,
    };
    setTranscriptEntries((prev) => [...prev, entry]);
  }, [stopSpeaking]);

  const handleStartSession = useCallback(async () => {
    await startSession();
  }, [startSession]);

  const handleEndSession = useCallback(() => {
    endSession('user_action');
    setTranscriptEntries([]);
    setStreamingText('');
    setStreamingTurnId(null);
  }, [endSession]);

  // Build transcript with streaming entry
  const displayEntries: TranscriptEntry[] = [
    ...transcriptEntries,
    ...(streamingTurnId && streamingText
      ? [
          {
            id: streamingTurnId,
            speaker: 'ai' as const,
            text: streamingText,
            timestamp: Date.now(),
            isStreaming: true,
          },
        ]
      : []),
  ];

  const isIdle = state === 'idle';
  const isStarting = state === 'starting';
  const isEnding = state === 'ending';
  const isActive = !isIdle && !isStarting && !isEnding && state !== 'error';

  if (!localParticipantId) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-center p-4', className)}>
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Waiting for session to load...</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Session Controls */}
      <div className="flex-shrink-0 mb-4">
        {isIdle ? (
          <Button
            onClick={handleStartSession}
            disabled={isStarting}
            className="w-full gap-2"
            size="lg"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                Starting AI Session...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start AI Session
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleEndSession}
            disabled={isEnding}
            variant="outline"
            className="w-full gap-2"
            size="sm"
          >
            {isEnding ? (
              <>
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                End AI Session
              </>
            )}
          </Button>
        )}
      </div>

      {/* AI Controls (when session is active) */}
      {isActive && (
        <div className="flex-shrink-0 py-4 border-b">
          <AIControls
            state={state}
            inputMode="push_to_talk"
            isUserSpeaking={isUserSpeaking}
            isAISpeaking={isAISpeaking}
            audioLevel={userAudioLevel}
            useToggleMode={true}
            onStartSpeaking={handleStartSpeaking}
            onStopSpeaking={handleStopSpeaking}
            onInterrupt={interruptAI}
          />
        </div>
      )}

      {/* Transcript */}
      {isActive && (
        <ScrollArea className="flex-1 mt-4">
          <AITranscript
            entries={displayEntries}
            maxHeight={maxHeight}
            emptyMessage="Click 'Start Speaking' to begin the conversation."
          />
        </ScrollArea>
      )}

      {/* Idle State */}
      {isIdle && !isStarting && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
          <p className="text-sm">Start an AI session to begin interacting with the AI assistant.</p>
        </div>
      )}
    </div>
  );
}
