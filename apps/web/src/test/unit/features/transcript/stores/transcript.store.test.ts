/**
 * Transcript Store Tests
 *
 * Tests for transcript state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useTranscriptStore,
  selectTurnsCount,
  selectFinalTurns,
  selectTurnsBySpeaker,
} from '@/features/transcript/stores/transcript.store';
import type { TranscriptTurn } from '@/features/transcript/types/transcript.types';

// =============================================================================
// Test Helpers
// =============================================================================

function resetStore() {
  useTranscriptStore.setState({
    turns: [],
    isSyncing: false,
    hasMore: false,
    error: null,
  });
}

function createMockTurn(overrides: Partial<TranscriptTurn> = {}): TranscriptTurn {
  return {
    turnId: `turn-${Date.now()}-${Math.random()}`,
    speakerRole: 'user',
    speakerId: 'speaker-001',
    speakerName: 'Test User',
    content: 'Test transcript content',
    isFinal: true,
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('Transcript Store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have empty turns array', () => {
      resetStore();
      expect(useTranscriptStore.getState().turns).toEqual([]);
    });

    it('should not be syncing', () => {
      resetStore();
      expect(useTranscriptStore.getState().isSyncing).toBe(false);
    });

    it('should not have more turns', () => {
      resetStore();
      expect(useTranscriptStore.getState().hasMore).toBe(false);
    });

    it('should have no error', () => {
      resetStore();
      expect(useTranscriptStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // appendTurn
  // ===========================================================================

  describe('appendTurn', () => {
    it('should add turn to array', () => {
      const turn = createMockTurn({ turnId: 'turn-001' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
      });

      expect(useTranscriptStore.getState().turns).toContainEqual(turn);
      expect(useTranscriptStore.getState().turns.length).toBe(1);
    });

    it('should append multiple turns', () => {
      const turn1 = createMockTurn({ turnId: 'turn-001' });
      const turn2 = createMockTurn({ turnId: 'turn-002' });
      const turn3 = createMockTurn({ turnId: 'turn-003' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn1);
        useTranscriptStore.getState().appendTurn(turn2);
        useTranscriptStore.getState().appendTurn(turn3);
      });

      expect(useTranscriptStore.getState().turns.length).toBe(3);
    });

    it('should update existing turn instead of duplicating', () => {
      const turn = createMockTurn({ turnId: 'turn-001', content: 'Original' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
      });

      const updatedTurn = { ...turn, content: 'Updated' };

      act(() => {
        useTranscriptStore.getState().appendTurn(updatedTurn);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns.length).toBe(1);
      expect(state.turns[0]?.content).toBe('Updated');
    });

    it('should maintain order when appending', () => {
      const turn1 = createMockTurn({ turnId: 'turn-001', content: 'First' });
      const turn2 = createMockTurn({ turnId: 'turn-002', content: 'Second' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn1);
        useTranscriptStore.getState().appendTurn(turn2);
      });

      const turns = useTranscriptStore.getState().turns;
      expect(turns[0]?.content).toBe('First');
      expect(turns[1]?.content).toBe('Second');
    });
  });

  // ===========================================================================
  // updateTurn
  // ===========================================================================

  describe('updateTurn', () => {
    it('should update turn content', () => {
      const turn = createMockTurn({ turnId: 'turn-001', content: 'Original', isFinal: false });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
        useTranscriptStore.getState().updateTurn('turn-001', 'Updated content', true);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns[0]?.content).toBe('Updated content');
      expect(state.turns[0]?.isFinal).toBe(true);
    });

    it('should update isFinal flag', () => {
      const turn = createMockTurn({ turnId: 'turn-001', isFinal: false });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
        useTranscriptStore.getState().updateTurn('turn-001', turn.content, true);
      });

      expect(useTranscriptStore.getState().turns[0]?.isFinal).toBe(true);
    });

    it('should do nothing for non-existent turn', () => {
      const turn = createMockTurn({ turnId: 'turn-001' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
        useTranscriptStore.getState().updateTurn('non-existent', 'New content', true);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns.length).toBe(1);
      expect(state.turns[0]?.content).toBe(turn.content);
    });

    it('should support streaming updates', () => {
      const turn = createMockTurn({ turnId: 'turn-001', content: '', isFinal: false });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
      });

      // Simulate streaming
      const words = ['Hello', 'Hello world', 'Hello world!'];
      for (const text of words) {
        act(() => {
          useTranscriptStore.getState().updateTurn('turn-001', text, false);
        });
      }

      // Final update
      act(() => {
        useTranscriptStore.getState().updateTurn('turn-001', 'Hello world!', true);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns[0]?.content).toBe('Hello world!');
      expect(state.turns[0]?.isFinal).toBe(true);
    });
  });

  // ===========================================================================
  // setTurns
  // ===========================================================================

  describe('setTurns', () => {
    it('should replace all turns', () => {
      const initialTurn = createMockTurn({ turnId: 'initial' });

      act(() => {
        useTranscriptStore.getState().appendTurn(initialTurn);
      });

      const newTurns = [
        createMockTurn({ turnId: 'new-001' }),
        createMockTurn({ turnId: 'new-002' }),
      ];

      act(() => {
        useTranscriptStore.getState().setTurns(newTurns, false);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns.length).toBe(2);
      expect(state.turns[0]?.turnId).toBe('new-001');
    });

    it('should set hasMore flag', () => {
      const turns = [createMockTurn()];

      act(() => {
        useTranscriptStore.getState().setTurns(turns, true);
      });

      expect(useTranscriptStore.getState().hasMore).toBe(true);
    });

    it('should clear syncing state', () => {
      act(() => {
        useTranscriptStore.getState().setSyncing(true);
        useTranscriptStore.getState().setTurns([], false);
      });

      expect(useTranscriptStore.getState().isSyncing).toBe(false);
    });
  });

  // ===========================================================================
  // setSyncing
  // ===========================================================================

  describe('setSyncing', () => {
    it('should set syncing to true', () => {
      act(() => {
        useTranscriptStore.getState().setSyncing(true);
      });

      expect(useTranscriptStore.getState().isSyncing).toBe(true);
    });

    it('should set syncing to false', () => {
      act(() => {
        useTranscriptStore.getState().setSyncing(true);
        useTranscriptStore.getState().setSyncing(false);
      });

      expect(useTranscriptStore.getState().isSyncing).toBe(false);
    });
  });

  // ===========================================================================
  // setError
  // ===========================================================================

  describe('setError', () => {
    it('should set error message', () => {
      act(() => {
        useTranscriptStore.getState().setError('Failed to load transcript');
      });

      expect(useTranscriptStore.getState().error).toBe('Failed to load transcript');
    });

    it('should clear syncing when setting error', () => {
      act(() => {
        useTranscriptStore.getState().setSyncing(true);
        useTranscriptStore.getState().setError('Error');
      });

      expect(useTranscriptStore.getState().isSyncing).toBe(false);
    });

    it('should clear error with null', () => {
      act(() => {
        useTranscriptStore.getState().setError('Error');
        useTranscriptStore.getState().setError(null);
      });

      expect(useTranscriptStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // clear
  // ===========================================================================

  describe('clear', () => {
    it('should reset to initial state', () => {
      const turns = [
        createMockTurn({ turnId: 'turn-001' }),
        createMockTurn({ turnId: 'turn-002' }),
      ];

      act(() => {
        useTranscriptStore.getState().setTurns(turns, true);
        useTranscriptStore.getState().setError('Error');
        useTranscriptStore.getState().clear();
      });

      const state = useTranscriptStore.getState();
      expect(state.turns).toEqual([]);
      expect(state.isSyncing).toBe(false);
      expect(state.hasMore).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ===========================================================================
  // Selectors
  // ===========================================================================

  describe('selectors', () => {
    describe('selectTurnsCount', () => {
      it('should return turn count', () => {
        const turns = [
          createMockTurn({ turnId: 'turn-001' }),
          createMockTurn({ turnId: 'turn-002' }),
          createMockTurn({ turnId: 'turn-003' }),
        ];

        act(() => {
          useTranscriptStore.getState().setTurns(turns, false);
        });

        const state = useTranscriptStore.getState();
        expect(selectTurnsCount(state)).toBe(3);
      });

      it('should return 0 for empty transcript', () => {
        const state = useTranscriptStore.getState();
        expect(selectTurnsCount(state)).toBe(0);
      });
    });

    describe('selectFinalTurns', () => {
      it('should return only final turns', () => {
        const turns = [
          createMockTurn({ turnId: 'turn-001', isFinal: true }),
          createMockTurn({ turnId: 'turn-002', isFinal: false }),
          createMockTurn({ turnId: 'turn-003', isFinal: true }),
        ];

        act(() => {
          useTranscriptStore.getState().setTurns(turns, false);
        });

        const state = useTranscriptStore.getState();
        const finalTurns = selectFinalTurns(state);

        expect(finalTurns.length).toBe(2);
        expect(finalTurns.every((t) => t.isFinal)).toBe(true);
      });

      it('should return empty array if no final turns', () => {
        const turns = [
          createMockTurn({ turnId: 'turn-001', isFinal: false }),
          createMockTurn({ turnId: 'turn-002', isFinal: false }),
        ];

        act(() => {
          useTranscriptStore.getState().setTurns(turns, false);
        });

        const state = useTranscriptStore.getState();
        expect(selectFinalTurns(state)).toEqual([]);
      });
    });

    describe('selectTurnsBySpeaker', () => {
      it('should return turns for specific speaker', () => {
        const turns = [
          createMockTurn({ turnId: 'turn-001', speakerId: 'user-001' }),
          createMockTurn({ turnId: 'turn-002', speakerId: 'ai-001' }),
          createMockTurn({ turnId: 'turn-003', speakerId: 'user-001' }),
          createMockTurn({ turnId: 'turn-004', speakerId: 'ai-001' }),
        ];

        act(() => {
          useTranscriptStore.getState().setTurns(turns, false);
        });

        const state = useTranscriptStore.getState();
        const userTurns = selectTurnsBySpeaker('user-001')(state);
        const aiTurns = selectTurnsBySpeaker('ai-001')(state);

        expect(userTurns.length).toBe(2);
        expect(aiTurns.length).toBe(2);
        expect(userTurns.every((t) => t.speakerId === 'user-001')).toBe(true);
        expect(aiTurns.every((t) => t.speakerId === 'ai-001')).toBe(true);
      });

      it('should return empty array for unknown speaker', () => {
        const turns = [
          createMockTurn({ turnId: 'turn-001', speakerId: 'user-001' }),
        ];

        act(() => {
          useTranscriptStore.getState().setTurns(turns, false);
        });

        const state = useTranscriptStore.getState();
        expect(selectTurnsBySpeaker('unknown')(state)).toEqual([]);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle rapid turn updates', () => {
      const turn = createMockTurn({ turnId: 'turn-001', content: '', isFinal: false });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
      });

      // Simulate rapid streaming updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          useTranscriptStore.getState().updateTurn('turn-001', `Content ${i}`, false);
        }
        useTranscriptStore.getState().updateTurn('turn-001', 'Final content', true);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns.length).toBe(1);
      expect(state.turns[0]?.content).toBe('Final content');
      expect(state.turns[0]?.isFinal).toBe(true);
    });

    it('should handle empty content', () => {
      const turn = createMockTurn({ turnId: 'turn-001', content: '' });

      act(() => {
        useTranscriptStore.getState().appendTurn(turn);
      });

      expect(useTranscriptStore.getState().turns[0]?.content).toBe('');
    });

    it('should handle large number of turns', () => {
      const turns = Array.from({ length: 1000 }, (_, i) =>
        createMockTurn({ turnId: `turn-${i}`, content: `Turn ${i}` })
      );

      act(() => {
        useTranscriptStore.getState().setTurns(turns, false);
      });

      const state = useTranscriptStore.getState();
      expect(state.turns.length).toBe(1000);
      expect(selectTurnsCount(state)).toBe(1000);
    });
  });
});
