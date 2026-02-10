/**
 * useAISession Hook
 *
 * Manages AI session lifecycle and state machine:
 * - Start/end AI sessions
 * - Start/stop speaking (push-to-talk)
 * - Track AI state transitions
 * - Handle audio input/output routing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/features/realtime/hooks/useWebSocket';
import type {
  AISessionState,
  AISessionInfo,
  AIError,
  AITurn,
} from '../types/session.types';
import type {
  UseAISessionOptions,
  UseAISessionReturn,
} from '../types/hooks.types';
import { useAudioCapture } from './useAudioCapture';
import { useAudioPlayback } from './useAudioPlayback';
import { useAISubscriptions } from './useAISubscriptions';
import { useAISessionActions } from './useAISessionActions';
import { arrayBufferToBase64 } from '../utils/ai-session.utils';

export function useAISession(options: UseAISessionOptions): UseAISessionReturn {
  const {
    participantId,
    audioDeviceId,
    inputMode = 'push_to_talk',
    callbacks,
  } = options;
  const { send, isConnected } = useWebSocket();

  // State
  const [state, setState] = useState<AISessionState>('idle');
  const [sessionInfo, setSessionInfo] = useState<AISessionInfo | null>(null);
  const [currentTurn, setCurrentTurn] = useState<AITurn | null>(null);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<AIError | null>(null);

  // Refs
  const callbacksRef = useRef(callbacks);
  const turnIdRef = useRef<string | null>(null);
  const sessionStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousConnectionState = useRef(isConnected);
  const stateRef = useRef(state);
  const sendRef = useRef(send);
  const isConnectedRef = useRef(isConnected);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Timeout helpers
  const clearSessionStartTimeout = useCallback(() => {
    if (sessionStartTimeoutRef.current) {
      clearTimeout(sessionStartTimeoutRef.current);
      sessionStartTimeoutRef.current = null;
    }
  }, []);

  const clearTurnTimeout = useCallback(() => {
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    clearSessionStartTimeout();
    clearTurnTimeout();
  }, [clearSessionStartTimeout, clearTurnTimeout]);

  // Audio hooks
  const audioCapture = useAudioCapture({
    deviceId: audioDeviceId,
    onAudioChunk: useCallback(
      (chunk: ArrayBuffer) => {
        if (!isConnected || state !== 'listening') return;
        const audio = arrayBufferToBase64(chunk);
        send('ai.input.audio.append', {
          audio,
          turnId: turnIdRef.current ?? undefined,
        });
      },
      [isConnected, state, send]
    ),
  });

  const audioPlayback = useAudioPlayback({
    onQueueEmpty: useCallback(() => {
      if (isAISpeaking) {
        setIsAISpeaking(false);
        callbacksRef.current?.onAIStoppedSpeaking?.();
        if (state === 'speaking') {
          setState('ready');
          callbacksRef.current?.onStateChange?.('ready');
        }
      }
    }, [isAISpeaking, state]),
  });

  // Refs for cleanup (must be after hooks that create the values)
  const audioCaptureRef = useRef(audioCapture);
  const audioPlaybackRef = useRef(audioPlayback);
  const clearAllTimeoutsRef = useRef(clearAllTimeouts);
  useEffect(() => {
    audioCaptureRef.current = audioCapture;
  }, [audioCapture]);
  useEffect(() => {
    audioPlaybackRef.current = audioPlayback;
  }, [audioPlayback]);
  useEffect(() => {
    clearAllTimeoutsRef.current = clearAllTimeouts;
  }, [clearAllTimeouts]);

  // WebSocket subscriptions
  useAISubscriptions(
    {
      setSessionInfo,
      setState,
      setCurrentTurn,
      setIsAISpeaking,
      setIsUserSpeaking,
      setError,
      clearSessionStartTimeout,
      clearTurnTimeout,
    },
    {
      state,
      inputMode,
      isAISpeaking,
      currentTurn,
      callbacksRef,
      turnIdRef,
      audioPlayback,
    }
  );

  // Session actions
  const actions = useAISessionActions(
    {
      state,
      inputMode,
      isConnected,
      isAISpeaking,
      participantId,
      audioDeviceId,
      stateRef,
      callbacksRef,
      turnIdRef,
      sessionStartTimeoutRef,
      turnTimeoutRef,
      audioCapture,
      audioPlayback,
      send,
    },
    { setState, setCurrentTurn, setIsAISpeaking, setIsUserSpeaking, setError }
  );

  // Network disconnection handling
  useEffect(() => {
    if (
      previousConnectionState.current &&
      !isConnected &&
      state !== 'idle' &&
      state !== 'error' &&
      state !== 'ending'
    ) {
      const disconnectError: AIError = {
        code: 'DISCONNECTED',
        message: 'Connection lost during AI session',
        recoverable: true,
      };
      setError(disconnectError);
      setState('error');
      audioCapture.stop();
      clearAllTimeouts();
      callbacksRef.current?.onError?.(disconnectError);
      callbacksRef.current?.onStateChange?.('error');
    }
    previousConnectionState.current = isConnected;
  }, [isConnected, state, audioCapture, clearAllTimeouts]);

  // Cleanup — only on true unmount (empty deps, refs for latest values)
  useEffect(() => {
    return () => {
      audioCaptureRef.current.stop();
      audioPlaybackRef.current.destroy();
      clearAllTimeoutsRef.current();
      if (isConnectedRef.current && stateRef.current !== 'idle') {
        sendRef.current('ai.session.end', { reason: 'user_action' });
      }
    };
  }, []);

  return {
    state,
    sessionInfo,
    currentTurn,
    isAISpeaking,
    isUserSpeaking,
    userAudioLevel: audioCapture.audioLevel,
    error,
    ...actions,
  };
}
