/**
 * useTranscript Hook
 *
 * Subscribes to transcript messages and manages transcript state.
 */

import { useCallback, useEffect } from 'react';
import { useSubscription, useSend } from '@/features/realtime';
import {
  useTranscriptStore,
  selectTurnsCount,
  selectFinalTurns,
} from '../stores/transcript.store';
import type { TranscriptTurn } from '../types/transcript.types';

export interface UseTranscriptOptions {
  /** Whether transcript is enabled */
  enabled?: boolean;
  /** Auto-scroll to bottom when new turns arrive */
  autoScroll?: boolean;
}

export interface UseTranscriptResult {
  /** All transcript turns */
  turns: TranscriptTurn[];
  /** Count of turns */
  turnsCount: number;
  /** Final turns only (no streaming) */
  finalTurns: TranscriptTurn[];
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Whether there are more turns to load */
  hasMore: boolean;
  /** Error message */
  error: string | null;
  /** Request sync from server */
  requestSync: (fromTurnId?: string) => Promise<void>;
  /** Clear transcript */
  clear: () => void;
}

/**
 * Hook for managing real-time transcript
 *
 * @example
 * ```tsx
 * const { turns, isSyncing, requestSync } = useTranscript({ enabled: true });
 *
 * return (
 *   <div>
 *     {turns.map((turn) => (
 *       <TranscriptEntry key={turn.turnId} turn={turn} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTranscript({
  enabled = true,
}: UseTranscriptOptions = {}): UseTranscriptResult {
  const send = useSend();

  // Store state
  const turns = useTranscriptStore((state) => state.turns);
  const isSyncing = useTranscriptStore((state) => state.isSyncing);
  const hasMore = useTranscriptStore((state) => state.hasMore);
  const error = useTranscriptStore((state) => state.error);

  // Selectors
  const turnsCount = useTranscriptStore(selectTurnsCount);
  const finalTurns = useTranscriptStore(selectFinalTurns);

  // Actions
  const appendTurn = useTranscriptStore((state) => state.appendTurn);
  const updateTurn = useTranscriptStore((state) => state.updateTurn);
  const setTurns = useTranscriptStore((state) => state.setTurns);
  const setSyncing = useTranscriptStore((state) => state.setSyncing);
  const clear = useTranscriptStore((state) => state.clear);

  // Subscribe to transcript append
  useSubscription(
    'transcript.append',
    useCallback(
      (payload) => {
        appendTurn({
          turnId: payload.turnId,
          speakerRole: payload.speakerRole,
          speakerId: payload.speakerId,
          speakerName: payload.speakerName,
          content: payload.content,
          isFinal: payload.isFinal,
          confidence: payload.confidence,
          startedAt: payload.startedAt,
          endedAt: payload.endedAt,
          durationMs: payload.durationMs,
        });
      },
      [appendTurn]
    ),
    enabled
  );

  // Subscribe to transcript update
  useSubscription(
    'transcript.update',
    useCallback(
      (payload) => {
        updateTurn(payload.turnId, payload.content, payload.isFinal);
      },
      [updateTurn]
    ),
    enabled
  );

  // Subscribe to sync response
  useSubscription(
    'transcript.sync.response',
    useCallback(
      (payload) => {
        setTurns(payload.turns, payload.hasMore);
      },
      [setTurns]
    ),
    enabled
  );

  // Request sync from server
  const requestSync = useCallback(
    async (fromTurnId?: string) => {
      setSyncing(true);
      await send('transcript.sync.request', { fromTurnId });
    },
    [send, setSyncing]
  );

  // Clear on unmount
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    turns,
    turnsCount,
    finalTurns,
    isSyncing,
    hasMore,
    error,
    requestSync,
    clear,
  };
}
