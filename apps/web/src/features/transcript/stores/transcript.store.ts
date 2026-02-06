/**
 * Transcript Store
 *
 * Zustand store for transcript state management.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TranscriptTurn, TranscriptState } from '../types/transcript.types';

// =============================================================================
// Initial State
// =============================================================================

const initialState: TranscriptState = {
  turns: [],
  isSyncing: false,
  hasMore: false,
  error: null,
};

// =============================================================================
// Actions
// =============================================================================

interface TranscriptActions {
  /** Append a new turn */
  appendTurn: (turn: TranscriptTurn) => void;
  /** Update an existing turn */
  updateTurn: (turnId: string, content: string, isFinal: boolean) => void;
  /** Set turns from sync response */
  setTurns: (turns: TranscriptTurn[], hasMore: boolean) => void;
  /** Set syncing state */
  setSyncing: (isSyncing: boolean) => void;
  /** Set error */
  setError: (error: string | null) => void;
  /** Clear transcript */
  clear: () => void;
}

// =============================================================================
// Store
// =============================================================================

export const useTranscriptStore = create<TranscriptState & TranscriptActions>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      appendTurn: (turn: TranscriptTurn) => {
        set((state) => {
          // Check if turn already exists (update instead)
          const existingIndex = state.turns.findIndex((t) => t.turnId === turn.turnId);
          if (existingIndex >= 0) {
            state.turns[existingIndex] = turn;
          } else {
            state.turns.push(turn);
          }
        });
      },

      updateTurn: (turnId: string, content: string, isFinal: boolean) => {
        set((state) => {
          const turn = state.turns.find((t) => t.turnId === turnId);
          if (turn) {
            turn.content = content;
            turn.isFinal = isFinal;
          }
        });
      },

      setTurns: (turns: TranscriptTurn[], hasMore: boolean) => {
        set((state) => {
          state.turns = turns;
          state.hasMore = hasMore;
          state.isSyncing = false;
        });
      },

      setSyncing: (isSyncing: boolean) => {
        set((state) => {
          state.isSyncing = isSyncing;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
          state.isSyncing = false;
        });
      },

      clear: () => {
        set(() => initialState);
      },
    }))
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get turns count
 */
export const selectTurnsCount = (state: TranscriptState): number => state.turns.length;

/**
 * Get final turns only
 */
export const selectFinalTurns = (state: TranscriptState): TranscriptTurn[] =>
  state.turns.filter((t) => t.isFinal);

/**
 * Get turns by speaker
 */
export const selectTurnsBySpeaker =
  (speakerId: string) =>
  (state: TranscriptState): TranscriptTurn[] =>
    state.turns.filter((t) => t.speakerId === speakerId);
