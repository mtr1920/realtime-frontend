/**
 * Compliance History Store Tests
 *
 * Tests for violation history tracking, filtering, and aggregation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useComplianceHistoryStore,
  selectViolationsCount,
  selectHasActiveFilter,
} from '@/features/compliance/stores/compliance-history.store';
import {
  createMockViolation,
  createViolationBatch,
  createViolationOfType,
  createViolationWithSeverity,
  createViolationWithDetails,
} from '@/test/factories';

// =============================================================================
// Test Setup
// =============================================================================

function resetStore() {
  useComplianceHistoryStore.setState({
    violations: [],
    filter: {
      severities: [],
      types: [],
      participantId: undefined,
      timeRange: undefined,
    },
    isLoading: false,
    error: null,
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('Compliance History Store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have empty violations array', () => {
      resetStore();
      expect(useComplianceHistoryStore.getState().violations).toEqual([]);
    });

    it('should have default filter', () => {
      resetStore();
      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.severities).toEqual([]);
      expect(filter.types).toEqual([]);
      expect(filter.participantId).toBeUndefined();
      expect(filter.timeRange).toBeUndefined();
    });

    it('should not be loading', () => {
      resetStore();
      expect(useComplianceHistoryStore.getState().isLoading).toBe(false);
    });

    it('should have no error', () => {
      resetStore();
      expect(useComplianceHistoryStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // addViolation
  // ===========================================================================

  describe('addViolation', () => {
    it('should add violation to history', () => {
      const violation = createMockViolation();

      act(() => {
        useComplianceHistoryStore.getState().addViolation(violation);
      });

      expect(useComplianceHistoryStore.getState().violations).toContainEqual(violation);
    });

    it('should prepend violation (newest first)', () => {
      const v1 = createMockViolation({ id: 'v1' });
      const v2 = createMockViolation({ id: 'v2' });

      act(() => {
        useComplianceHistoryStore.getState().addViolation(v1);
        useComplianceHistoryStore.getState().addViolation(v2);
      });

      const violations = useComplianceHistoryStore.getState().violations;
      expect(violations[0]?.id).toBe('v2');
      expect(violations[1]?.id).toBe('v1');
    });
  });

  // ===========================================================================
  // setViolations
  // ===========================================================================

  describe('setViolations', () => {
    it('should replace all violations', () => {
      const initial = createViolationBatch(3);
      const replacement = createViolationBatch(5);

      act(() => {
        useComplianceHistoryStore.getState().setViolations(initial);
      });

      expect(useComplianceHistoryStore.getState().violations.length).toBe(3);

      act(() => {
        useComplianceHistoryStore.getState().setViolations(replacement);
      });

      expect(useComplianceHistoryStore.getState().violations.length).toBe(5);
    });

    it('should clear loading state', () => {
      act(() => {
        useComplianceHistoryStore.getState().setLoading(true);
        useComplianceHistoryStore.getState().setViolations([]);
      });

      expect(useComplianceHistoryStore.getState().isLoading).toBe(false);
    });

    it('should clear error', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Some error');
        useComplianceHistoryStore.getState().setViolations([]);
      });

      expect(useComplianceHistoryStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // clearHistory
  // ===========================================================================

  describe('clearHistory', () => {
    it('should clear all violations', () => {
      const violations = createViolationBatch(5);

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
        useComplianceHistoryStore.getState().clearHistory();
      });

      expect(useComplianceHistoryStore.getState().violations.length).toBe(0);
    });

    it('should clear error', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Error');
        useComplianceHistoryStore.getState().clearHistory();
      });

      expect(useComplianceHistoryStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // Filtering
  // ===========================================================================

  describe('setFilter', () => {
    it('should set severity filter', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          severities: ['high', 'critical'],
        });
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.severities).toEqual(['high', 'critical']);
    });

    it('should set type filter', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          types: ['tab_switch', 'window_blur'],
        });
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.types).toEqual(['tab_switch', 'window_blur']);
    });

    it('should set participant filter', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          participantId: 'participant-001',
        });
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.participantId).toBe('participant-001');
    });

    it('should set time range filter', () => {
      const start = '2024-01-01T00:00:00Z';
      const end = '2024-01-31T23:59:59Z';

      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          timeRange: { start, end },
        });
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.timeRange?.start).toBe(start);
      expect(filter.timeRange?.end).toBe(end);
    });

    it('should merge with existing filter', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
        useComplianceHistoryStore.getState().setFilter({ types: ['tab_switch'] });
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.severities).toEqual(['high']);
      expect(filter.types).toEqual(['tab_switch']);
    });
  });

  describe('resetFilter', () => {
    it('should reset filter to initial state', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          severities: ['high', 'critical'],
          types: ['tab_switch'],
          participantId: 'participant-001',
          timeRange: { start: '2024-01-01' },
        });
        useComplianceHistoryStore.getState().resetFilter();
      });

      const { filter } = useComplianceHistoryStore.getState();
      expect(filter.severities).toEqual([]);
      expect(filter.types).toEqual([]);
      expect(filter.participantId).toBeUndefined();
      expect(filter.timeRange).toBeUndefined();
    });
  });

  describe('getFilteredViolations', () => {
    beforeEach(() => {
      // Set up test data
      const violations = [
        createViolationWithSeverity('high', { id: 'v1', type: 'tab_switch' }),
        createViolationWithSeverity('low', { id: 'v2', type: 'window_blur' }),
        createViolationWithSeverity('critical', { id: 'v3', type: 'tab_switch' }),
        createViolationWithSeverity('info', { id: 'v4', type: 'copy_paste' }),
        createViolationWithDetails(
          { participantId: 'p1' },
          { id: 'v5', severity: 'medium', type: 'tab_switch' }
        ),
        createViolationWithDetails(
          { participantId: 'p2' },
          { id: 'v6', severity: 'high', type: 'window_blur' }
        ),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });
    });

    it('should return all violations when no filter', () => {
      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(6);
    });

    it('should filter by severity', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({ severities: ['high', 'critical'] });
      });

      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(3); // v1, v3, v6
      expect(filtered.every((v) => ['high', 'critical'].includes(v.severity))).toBe(true);
    });

    it('should filter by type', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({ types: ['tab_switch'] });
      });

      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(3); // v1, v3, v5
      expect(filtered.every((v) => v.type === 'tab_switch')).toBe(true);
    });

    it('should filter by participant', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({ participantId: 'p1' });
      });

      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(1); // v5
      expect(filtered[0]?.details?.participantId).toBe('p1');
    });

    it('should combine multiple filters', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({
          severities: ['high'],
          types: ['window_blur'],
        });
      });

      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(1); // v6
      expect(filtered[0]?.id).toBe('v6');
    });

    it('should filter by time range', () => {
      const now = new Date();
      const v1 = createMockViolation({
        id: 'time-1',
        timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
      });
      const v2 = createMockViolation({
        id: 'time-2',
        timestamp: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
      });

      act(() => {
        useComplianceHistoryStore.getState().setViolations([v1, v2]);
        useComplianceHistoryStore.getState().setFilter({
          timeRange: {
            start: new Date(now.getTime() - 5400000).toISOString(), // 1.5 hours ago
          },
        });
      });

      const filtered = useComplianceHistoryStore.getState().getFilteredViolations();
      expect(filtered.length).toBe(1); // Only v1
      expect(filtered[0]?.id).toBe('time-1');
    });
  });

  // ===========================================================================
  // Aggregations
  // ===========================================================================

  describe('getViolationsBySeverity', () => {
    it('should count violations by severity', () => {
      const violations = [
        createViolationWithSeverity('high'),
        createViolationWithSeverity('high'),
        createViolationWithSeverity('low'),
        createViolationWithSeverity('critical'),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });

      const counts = useComplianceHistoryStore.getState().getViolationsBySeverity();
      expect(counts.high).toBe(2);
      expect(counts.low).toBe(1);
      expect(counts.critical).toBe(1);
      expect(counts.info).toBe(0);
      expect(counts.medium).toBe(0);
    });
  });

  describe('getViolationsByType', () => {
    it('should count violations by type', () => {
      const violations = [
        createViolationOfType('tab_switch'),
        createViolationOfType('tab_switch'),
        createViolationOfType('window_blur'),
        createViolationOfType('copy_paste'),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });

      const counts = useComplianceHistoryStore.getState().getViolationsByType();
      expect(counts.tab_switch).toBe(2);
      expect(counts.window_blur).toBe(1);
      expect(counts.copy_paste).toBe(1);
    });
  });

  describe('getViolationsByParticipant', () => {
    it('should count violations by participant', () => {
      const violations = [
        createViolationWithDetails({ participantId: 'p1' }),
        createViolationWithDetails({ participantId: 'p1' }),
        createViolationWithDetails({ participantId: 'p2' }),
        createMockViolation(), // No participantId
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });

      const counts = useComplianceHistoryStore.getState().getViolationsByParticipant();
      expect(counts['p1']).toBe(2);
      expect(counts['p2']).toBe(1);
      expect(Object.keys(counts).length).toBe(2); // Only p1 and p2
    });
  });

  // ===========================================================================
  // Loading and Error States
  // ===========================================================================

  describe('setLoading', () => {
    it('should set loading state', () => {
      act(() => {
        useComplianceHistoryStore.getState().setLoading(true);
      });

      expect(useComplianceHistoryStore.getState().isLoading).toBe(true);

      act(() => {
        useComplianceHistoryStore.getState().setLoading(false);
      });

      expect(useComplianceHistoryStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Failed to load history');
      });

      expect(useComplianceHistoryStore.getState().error).toBe('Failed to load history');
    });

    it('should clear loading when setting error', () => {
      act(() => {
        useComplianceHistoryStore.getState().setLoading(true);
        useComplianceHistoryStore.getState().setError('Error');
      });

      expect(useComplianceHistoryStore.getState().isLoading).toBe(false);
    });

    it('should clear error with null', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Error');
        useComplianceHistoryStore.getState().setError(null);
      });

      expect(useComplianceHistoryStore.getState().error).toBeNull();
    });
  });

  // ===========================================================================
  // Selectors
  // ===========================================================================

  describe('selectors', () => {
    describe('selectViolationsCount', () => {
      it('should return violations count', () => {
        const violations = createViolationBatch(5);

        act(() => {
          useComplianceHistoryStore.getState().setViolations(violations);
        });

        const state = useComplianceHistoryStore.getState();
        expect(selectViolationsCount(state)).toBe(5);
      });
    });

    describe('selectHasActiveFilter', () => {
      it('should return false when no filter', () => {
        resetStore();
        const state = useComplianceHistoryStore.getState();
        expect(selectHasActiveFilter(state)).toBe(false);
      });

      it('should return true when severity filter active', () => {
        act(() => {
          useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
        });

        const state = useComplianceHistoryStore.getState();
        expect(selectHasActiveFilter(state)).toBe(true);
      });

      it('should return true when type filter active', () => {
        act(() => {
          useComplianceHistoryStore.getState().setFilter({ types: ['tab_switch'] });
        });

        const state = useComplianceHistoryStore.getState();
        expect(selectHasActiveFilter(state)).toBe(true);
      });

      it('should return true when participant filter active', () => {
        act(() => {
          useComplianceHistoryStore.getState().setFilter({ participantId: 'p1' });
        });

        const state = useComplianceHistoryStore.getState();
        expect(selectHasActiveFilter(state)).toBe(true);
      });

      it('should return true when time range filter active', () => {
        act(() => {
          useComplianceHistoryStore.getState().setFilter({
            timeRange: { start: '2024-01-01' },
          });
        });

        const state = useComplianceHistoryStore.getState();
        expect(selectHasActiveFilter(state)).toBe(true);
      });
    });
  });
});
