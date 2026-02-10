/**
 * useAISubscriptions Hook - Handles WebSocket subscriptions for AI session messages.
 */

import { useCallback, type MutableRefObject } from 'react';
import { useSubscription } from '@/features/realtime/hooks/useWebSocket';
import type {
  AISessionStartedPayload,
  AISessionEndedPayload,
  AIOutputAudioChunkPayload,
  AIOutputAudioCompletePayload,
  AIOutputTextDeltaPayload,
  AIOutputTextCompletePayload,
  AIErrorPayload,
  AIProviderSwitchedPayload,
  AIVadSpeechStartPayload,
  AIVadSpeechEndPayload,
} from '@/features/realtime/types/messages';
import type {
  AISessionState,
  AISessionInfo,
  AISessionCallbacks,
  AIInputMode,
  AICapabilities,
  AIError,
  AITurn,
} from '../types/session.types';
import { base64ToArrayBuffer } from '../utils/ai-session.utils';

export interface AISubscriptionHandlers {
  setSessionInfo: React.Dispatch<React.SetStateAction<AISessionInfo | null>>;
  setState: React.Dispatch<React.SetStateAction<AISessionState>>;
  setCurrentTurn: React.Dispatch<React.SetStateAction<AITurn | null>>;
  setIsAISpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setIsUserSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<AIError | null>>;
  clearSessionStartTimeout: () => void;
  clearTurnTimeout: () => void;
}

export interface AISubscriptionDeps {
  state: AISessionState;
  inputMode: AIInputMode;
  isAISpeaking: boolean;
  currentTurn: AITurn | null;
  callbacksRef: MutableRefObject<AISessionCallbacks | undefined>;
  turnIdRef: MutableRefObject<string | null>;
  audioPlayback: { enqueue: (data: ArrayBuffer) => void };
}

export function useAISubscriptions(
  handlers: AISubscriptionHandlers,
  deps: AISubscriptionDeps
): void {
  const {
    setSessionInfo,
    setState,
    setCurrentTurn,
    setIsAISpeaking,
    setIsUserSpeaking,
    setError,
    clearSessionStartTimeout,
    clearTurnTimeout,
  } = handlers;
  const {
    state,
    inputMode,
    isAISpeaking,
    currentTurn,
    callbacksRef,
    turnIdRef,
    audioPlayback,
  } = deps;

  // AI Session Started
  useSubscription(
    'ai.session.started',
    useCallback(
      (payload: AISessionStartedPayload) => {
        clearSessionStartTimeout();
        const info: AISessionInfo = {
          aiSessionId: payload.aiSessionId,
          provider: payload.provider,
          capabilities: payload.capabilities as AICapabilities,
          startedAt: Date.now(),
          turnHistory: [],
        };
        setSessionInfo(info);
        setState('ready');
        setError(null);
        callbacksRef.current?.onStateChange?.('ready');
      },
      [
        clearSessionStartTimeout,
        setSessionInfo,
        setState,
        setError,
        callbacksRef,
      ]
    ),
    state === 'starting' || state === 'idle'
  );

  // AI Session Ended
  useSubscription(
    'ai.session.ended',
    useCallback(
      (payload: AISessionEndedPayload) => {
        setSessionInfo(null);
        setCurrentTurn(null);
        setState('idle');
        setIsAISpeaking(false);
        setIsUserSpeaking(false);
        callbacksRef.current?.onSessionEnd?.(payload.stats);
        callbacksRef.current?.onStateChange?.('idle');
      },
      [
        setSessionInfo,
        setCurrentTurn,
        setState,
        setIsAISpeaking,
        setIsUserSpeaking,
        callbacksRef,
      ]
    ),
    state !== 'idle'
  );

  // AI Audio Output Chunk
  useSubscription(
    'ai.output.audio.chunk',
    useCallback(
      (payload: AIOutputAudioChunkPayload) => {
        clearTurnTimeout();
        audioPlayback.enqueue(base64ToArrayBuffer(payload.audio));
        if (!isAISpeaking) {
          setIsAISpeaking(true);
          setState('speaking');
          callbacksRef.current?.onAISpeaking?.();
          callbacksRef.current?.onStateChange?.('speaking');
        }
      },
      [
        audioPlayback,
        isAISpeaking,
        clearTurnTimeout,
        setIsAISpeaking,
        setState,
        callbacksRef,
      ]
    ),
    state !== 'idle'
  );

  // AI Audio Output Complete
  useSubscription(
    'ai.output.audio.complete',
    useCallback((_payload: AIOutputAudioCompletePayload) => {
      // Audio stream complete, playback continues until queue empties
    }, []),
    state !== 'idle'
  );

  // AI Text Delta (streaming)
  useSubscription(
    'ai.output.text.delta',
    useCallback(
      (payload: AIOutputTextDeltaPayload) => {
        callbacksRef.current?.onTextDelta?.(payload.text, payload.isFinal);
        if (currentTurn && payload.turnId === currentTurn.id) {
          setCurrentTurn((prev) =>
            prev
              ? { ...prev, aiText: (prev.aiText ?? '') + payload.text }
              : null
          );
        }
      },
      [currentTurn, callbacksRef, setCurrentTurn]
    ),
    state !== 'idle'
  );

  // AI Text Complete
  useSubscription(
    'ai.output.text.complete',
    useCallback(
      (payload: AIOutputTextCompletePayload) => {
        callbacksRef.current?.onTextComplete?.(payload.text);
      },
      [callbacksRef]
    ),
    state !== 'idle'
  );

  // AI Error
  useSubscription(
    'ai.error',
    useCallback(
      (payload: AIErrorPayload) => {
        const aiError: AIError = {
          code: payload.code as AIError['code'],
          message: payload.message,
          recoverable: payload.recoverable,
          turnId: payload.turnId,
        };
        setError(aiError);
        if (!payload.recoverable) {
          setState('error');
          callbacksRef.current?.onStateChange?.('error');
        }
        callbacksRef.current?.onError?.(aiError);
      },
      [setError, setState, callbacksRef]
    ),
    state !== 'idle'
  );

  // AI Provider Switched
  useSubscription(
    'ai.provider.switched',
    useCallback(
      (payload: AIProviderSwitchedPayload) => {
        setSessionInfo((prev) =>
          prev ? { ...prev, provider: payload.to } : null
        );
        callbacksRef.current?.onProviderSwitch?.(
          payload.from,
          payload.to,
          payload.reason
        );
      },
      [setSessionInfo, callbacksRef]
    ),
    state !== 'idle'
  );

  // VAD Speech Start (voice-activated mode)
  useSubscription(
    'ai.vad.speechStart',
    useCallback(
      (payload: AIVadSpeechStartPayload) => {
        if (inputMode === 'voice_activated') {
          turnIdRef.current = payload.turnId;
          setIsUserSpeaking(true);
          setState('listening');
          callbacksRef.current?.onStateChange?.('listening');
        }
      },
      [inputMode, turnIdRef, setIsUserSpeaking, setState, callbacksRef]
    ),
    state !== 'idle' && inputMode === 'voice_activated'
  );

  // VAD Speech End (voice-activated mode)
  useSubscription(
    'ai.vad.speechEnd',
    useCallback(
      (payload: AIVadSpeechEndPayload) => {
        if (inputMode === 'voice_activated') {
          setIsUserSpeaking(false);
          setState('processing');
          callbacksRef.current?.onStateChange?.('processing');
          const turn: AITurn = {
            id: payload.turnId,
            initiator: 'user',
            startedAt: Date.now() - payload.durationMs,
            isComplete: false,
          };
          setCurrentTurn(turn);
        }
      },
      [inputMode, setIsUserSpeaking, setState, setCurrentTurn, callbacksRef]
    ),
    state !== 'idle' && inputMode === 'voice_activated'
  );
}
