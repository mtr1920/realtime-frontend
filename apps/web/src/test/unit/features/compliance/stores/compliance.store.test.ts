/**
 * Compliance Store Tests
 *
 * Tests for violation queue management, visibility, and auto-dismiss.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  useComplianceStore,
  MAX_VISIBLE_VIOLATIONS,
  DISMISS_DELAYS,
  getDismissDelay,
} from '@/features/compliance/stores/compliance.store';
import {
  createMockViolation,
  createViolationBatch,
  createCriticalViolation,
  createInfoViolation,
} from '@/test/factories';

// =============================================================================
// Test Setup
// =============================================================================

function resetStore() {
  useComplianceStore.setState({
    violations: [],
    visibleIds: new Set(),
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('Compliance Store', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStore();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have empty violations array', () => {
      resetStore();
      expect(useComplianceStore.getState().violations).toEqual([]);
    });

    it('should have empty visibleIds set', () => {
      resetStore();
      expect(useComplianceStore.getState().visibleIds.size).toBe(0);
    });
  });

  // ===========================================================================
  // addViolation
  // ===========================================================================

  describe('addViolation', () => {
    it('should add violation to the array', () => {
      const violation = createMockViolation();

      act(() => {
        useComplianceStore.getState().addViolation(violation);
      });

      expect(useComplianceStore.getState().violations).toContainEqual(violation);
    });

    it('should add violation to visible set when under limit', () => {
      const violation = createMockViolation();

      act(() => {
        useComplianceStore.getState().addViolation(violation);
      });

      expect(useComplianceStore.getState().visibleIds.has(violation.id)).toBe(true);
    });

    it('should prepend violation (newest first)', () => {
      const violation1 = createMockViolation({ id: 'v1' });
      const violation2 = createMockViolation({ id: 'v2' });

      act(() => {
        useComplianceStore.getState().addViolation(violation1);
        useComplianceStore.getState().addViolation(violation2);
      });

      const violations = useComplianceStore.getState().violations;
      expect(violations[0]?.id).toBe('v2');
      expect(violations[1]?.id).toBe('v1');
    });

    it('should not exceed MAX_VISIBLE_VIOLATIONS in visible set', () => {
      const violations = createViolationBatch(MAX_VISIBLE_VIOLATIONS + 2);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      expect(useComplianceStore.getState().visibleIds.size).toBe(MAX_VISIBLE_VIOLATIONS);
    });

    it('should queue violations beyond the limit', () => {
      const violations = createViolationBatch(5);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      const state = useComplianceStore.getState();
      expect(state.violations.length).toBe(5);
      expect(state.visibleIds.size).toBe(MAX_VISIBLE_VIOLATIONS);
      expect(state.getQueuedCount()).toBe(5 - MAX_VISIBLE_VIOLATIONS);
    });
  });

  // ===========================================================================
  // dismissViolation
  // ===========================================================================

  describe('dismissViolation', () => {
    it('should remove violation from visible set', () => {
      const violation = createMockViolation({ id: 'dismiss-me' });

      act(() => {
        useComplianceStore.getState().addViolation(violation);
      });

      expect(useComplianceStore.getState().visibleIds.has('dismiss-me')).toBe(true);

      act(() => {
        useComplianceStore.getState().dismissViolation('dismiss-me');
      });

      expect(useComplianceStore.getState().visibleIds.has('dismiss-me')).toBe(false);
    });

    it('should remove violation from violations array', () => {
      const violation = createMockViolation({ id: 'remove-me' });

      act(() => {
        useComplianceStore.getState().addViolation(violation);
      });

      expect(useComplianceStore.getState().violations.length).toBe(1);

      act(() => {
        useComplianceStore.getState().dismissViolation('remove-me');
      });

      expect(useComplianceStore.getState().violations.length).toBe(0);
    });

    it('should promote next queued violation to visible', () => {
      const violations = createViolationBatch(MAX_VISIBLE_VIOLATIONS + 1);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      // The last added violation should be first in array but may or may not be visible
      // depending on how we hit the limit

      // Dismiss the first visible one
      const visibleIds = Array.from(useComplianceStore.getState().visibleIds);
      const firstVisible = visibleIds[0]!;

      act(() => {
        useComplianceStore.getState().dismissViolation(firstVisible);
      });

      // Should still have MAX_VISIBLE visible (promoted one from queue)
      const state = useComplianceStore.getState();
      if (state.violations.length >= MAX_VISIBLE_VIOLATIONS) {
        expect(state.visibleIds.size).toBe(MAX_VISIBLE_VIOLATIONS);
      }
    });

    it('should handle dismissing non-existent violation gracefully', () => {
      act(() => {
        useComplianceStore.getState().dismissViolation('non-existent');
      });

      // Should not throw
      expect(useComplianceStore.getState().violations).toEqual([]);
    });
  });

  // ===========================================================================
  // dismissAll
  // ===========================================================================

  describe('dismissAll', () => {
    it('should clear all violations', () => {
      const violations = createViolationBatch(5);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      expect(useComplianceStore.getState().violations.length).toBe(5);

      act(() => {
        useComplianceStore.getState().dismissAll();
      });

      expect(useComplianceStore.getState().violations.length).toBe(0);
    });

    it('should clear visible set', () => {
      const violations = createViolationBatch(3);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      expect(useComplianceStore.getState().visibleIds.size).toBeGreaterThan(0);

      act(() => {
        useComplianceStore.getState().dismissAll();
      });

      expect(useComplianceStore.getState().visibleIds.size).toBe(0);
    });
  });

  // ===========================================================================
  // clearViolations
  // ===========================================================================

  describe('clearViolations', () => {
    it('should clear all violations (same as dismissAll)', () => {
      const violations = createViolationBatch(3);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
        useComplianceStore.getState().clearViolations();
      });

      expect(useComplianceStore.getState().violations.length).toBe(0);
      expect(useComplianceStore.getState().visibleIds.size).toBe(0);
    });
  });

  // ===========================================================================
  // getVisibleViolations
  // ===========================================================================

  describe('getVisibleViolations', () => {
    it('should return only visible violations', () => {
      const violations = createViolationBatch(5);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      const visible = useComplianceStore.getState().getVisibleViolations();

      expect(visible.length).toBe(MAX_VISIBLE_VIOLATIONS);
      visible.forEach((v) => {
        expect(useComplianceStore.getState().visibleIds.has(v.id)).toBe(true);
      });
    });

    it('should return empty array when no violations', () => {
      expect(useComplianceStore.getState().getVisibleViolations()).toEqual([]);
    });
  });

  // ===========================================================================
  // getQueuedCount
  // ===========================================================================

  describe('getQueuedCount', () => {
    it('should return 0 when no queued violations', () => {
      const violations = createViolationBatch(2);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      expect(useComplianceStore.getState().getQueuedCount()).toBe(0);
    });

    it('should return correct queued count', () => {
      const violations = createViolationBatch(MAX_VISIBLE_VIOLATIONS + 3);

      act(() => {
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      expect(useComplianceStore.getState().getQueuedCount()).toBe(3);
    });
  });

  // ===========================================================================
  // getDismissDelay
  // ===========================================================================

  describe('getDismissDelay', () => {
    it('should return correct delay for each severity', () => {
      expect(getDismissDelay('info')).toBe(DISMISS_DELAYS.info);
      expect(getDismissDelay('low')).toBe(DISMISS_DELAYS.low);
      expect(getDismissDelay('medium')).toBe(DISMISS_DELAYS.medium);
      expect(getDismissDelay('high')).toBe(DISMISS_DELAYS.high);
      expect(getDismissDelay('critical')).toBe(DISMISS_DELAYS.critical);
    });

    it('should have critical violations stay longer', () => {
      expect(getDismissDelay('critical')).toBeGreaterThan(getDismissDelay('info'));
      expect(getDismissDelay('critical')).toBeGreaterThan(getDismissDelay('medium'));
    });
  });

  // ===========================================================================
  // Constants
  // ===========================================================================

  describe('constants', () => {
    it('should have MAX_VISIBLE_VIOLATIONS defined', () => {
      expect(MAX_VISIBLE_VIOLATIONS).toBe(3);
    });

    it('should have DISMISS_DELAYS for all severities', () => {
      expect(DISMISS_DELAYS.info).toBeDefined();
      expect(DISMISS_DELAYS.low).toBeDefined();
      expect(DISMISS_DELAYS.medium).toBeDefined();
      expect(DISMISS_DELAYS.high).toBeDefined();
      expect(DISMISS_DELAYS.critical).toBeDefined();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle rapid-fire violations', () => {
      const violations = createViolationBatch(10);

      act(() => {
        // Add all violations in rapid succession
        violations.forEach((v) => useComplianceStore.getState().addViolation(v));
      });

      const state = useComplianceStore.getState();
      expect(state.violations.length).toBe(10);
      expect(state.visibleIds.size).toBe(MAX_VISIBLE_VIOLATIONS);
    });

    it('should handle mixed severity violations', () => {
      const info = createInfoViolation();
      const critical = createCriticalViolation();
      const medium = createMockViolation({ severity: 'medium' });

      act(() => {
        useComplianceStore.getState().addViolation(info);
        useComplianceStore.getState().addViolation(critical);
        useComplianceStore.getState().addViolation(medium);
      });

      const state = useComplianceStore.getState();
      expect(state.violations.length).toBe(3);
      expect(state.getVisibleViolations()).toHaveLength(3);
    });
  });
});
