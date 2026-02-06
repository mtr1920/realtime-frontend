/**
 * useAISessionActions Hook - Handles AI session lifecycle actions.
 */

import { useCallback, type MutableRefObject } from 'react';
import type { ClientMessagePayloads, ExtendedClientMessageType } from '@/features/realtime/types/messages';
import type { AISessionState, AISessionCallbacks, AIInputMode, AIError, AITurn } from '../types/session.types';
import { AI_SESSION_START_TIMEOUT, AI_TURN_TIMEOUT, generateTurnId, arrayBufferToBase64 } from '../utils/ai-session.utils';

export interface AISessionActionDeps {
  state: AISessionState;
  inputMode: AIInputMode;
  isConnected: boolean;
  isAISpeaking: boolean;
  participantId: string;
  audioDeviceId?: string;
  stateRef: MutableRefObject<AISessionState>;
  callbacksRef: MutableRefObject<AISessionCallbacks | undefined>;
  turnIdRef: MutableRefObject<string | null>;
  sessionStartTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  turnTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  audioCapture: { start: (deviceId?: string, onChunk?: (chunk: ArrayBuffer) => void) => Promise<void>; stop: () => void };
  audioPlayback: { initialize: () => Promise<void>; interrupt: () => void };
  send: <T extends ExtendedClientMessageType>(type: T, payload: ClientMessagePayloads[T]) => Promise<void>;
}

export interface AISessionActionHandlers {
  setState: React.Dispatch<React.SetStateAction<AISessionState>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<AITurn | null>>;
  setIsAISpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<AIError | null>>;
}

export interface AISessionActions {
  startSession: (language?: string, voiceId?: string) => Promise<void>;
  endSession: (reason?: 'completed' | 'user_action') => void;
  startSpeaking: () => Promise<void>;
  stopSpeaking: () => void;
  interruptAI: () => void;
}

export function useAISessionActions(deps: AISessionActionDeps, handlers: AISessionActionHandlers): AISessionActions {
  const { state, inputMode, isConnected, isAISpeaking, participantId, audioDeviceId, stateRef, callbacksRef, turnIdRef, sessionStartTimeoutRef, turnTimeoutRef, audioCapture, audioPlayback, send } = deps;
  const { setState, setCurrentTurn, setIsAISpeaking, setIsUserSpeaking, setError } = handlers;

  const startSession = useCallback(async (language?: string, voiceId?: string) => {
    if (state !== 'idle' || !isConnected) return;
    setError(null);
    setState('starting');
    callbacksRef.current?.onStateChange?.('starting');
    sessionStartTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === 'starting') {
        const timeoutError: AIError = { code: 'TIMEOUT', message: 'AI session start timed out', recoverable: true };
        setError(timeoutError);
        setState('error');
        callbacksRef.current?.onError?.(timeoutError);
        callbacksRef.current?.onStateChange?.('error');
      }
    }, AI_SESSION_START_TIMEOUT);
    await audioPlayback.initialize();
    send('ai.session.start', { participantId, language, voiceId });
  }, [state, isConnected, participantId, send, audioPlayback, sessionStartTimeoutRef, stateRef, callbacksRef, setState, setError]);

  const endSession = useCallback((reason: 'completed' | 'user_action' = 'user_action') => {
    if (state === 'idle') return;
    audioCapture.stop();
    audioPlayback.interrupt();
    setState('ending');
    callbacksRef.current?.onStateChange?.('ending');
    send('ai.session.end', { reason });
  }, [state, audioCapture, audioPlayback, send, callbacksRef, setState]);

  const startSpeaking = useCallback(async () => {
    if (state !== 'ready' || inputMode !== 'push_to_talk') return;
    const turnId = generateTurnId();
    turnIdRef.current = turnId;
    const turn: AITurn = { id: turnId, initiator: 'user', startedAt: Date.now(), isComplete: false };
    setCurrentTurn(turn);
    if (isAISpeaking) { audioPlayback.interrupt(); setIsAISpeaking(false); }
    setState('listening');
    setIsUserSpeaking(true);
    callbacksRef.current?.onStateChange?.('listening');
    send('ai.turn.start', { turnId });
    await audioCapture.start(audioDeviceId, (chunk: ArrayBuffer) => {
      if (!isConnected) return;
      const audio = arrayBufferToBase64(chunk);
      send('ai.input.audio.append', { audio, turnId });
    });
  }, [state, inputMode, isAISpeaking, isConnected, audioDeviceId, audioPlayback, audioCapture, send, turnIdRef, callbacksRef, setState, setCurrentTurn, setIsAISpeaking, setIsUserSpeaking]);

  const stopSpeaking = useCallback(() => {
    if (state !== 'listening' || inputMode !== 'push_to_talk') return;
    audioCapture.stop();
    setIsUserSpeaking(false);
    send('ai.input.audio.commit', { turnId: turnIdRef.current ?? undefined });
    if (turnIdRef.current) send('ai.turn.end', { turnId: turnIdRef.current });
    setState('processing');
    callbacksRef.current?.onStateChange?.('processing');
    turnTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === 'processing') {
        const timeoutError: AIError = { code: 'TIMEOUT', message: 'AI response timed out', recoverable: true, turnId: turnIdRef.current ?? undefined };
        setError(timeoutError);
        setState('error');
        callbacksRef.current?.onError?.(timeoutError);
        callbacksRef.current?.onStateChange?.('error');
      }
    }, AI_TURN_TIMEOUT);
  }, [state, inputMode, audioCapture, send, turnIdRef, turnTimeoutRef, stateRef, callbacksRef, setState, setIsUserSpeaking, setError]);

  const interruptAI = useCallback(() => {
    if (!isAISpeaking) return;
    audioPlayback.interrupt();
    setIsAISpeaking(false);
    callbacksRef.current?.onAIStoppedSpeaking?.();
    setState('ready');
    callbacksRef.current?.onStateChange?.('ready');
  }, [isAISpeaking, audioPlayback, callbacksRef, setState, setIsAISpeaking]);

  return { startSession, endSession, startSpeaking, stopSpeaking, interruptAI };
}
