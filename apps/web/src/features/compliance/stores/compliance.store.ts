/**
 * Compliance Store
 *
 * Zustand store for managing active compliance violations in the UI.
 * Handles violation queue with configurable limits and auto-dismiss.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ComplianceViolation, ViolationSeverity } from '../types/compliance.types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum number of violations visible at once */
export const MAX_VISIBLE_VIOLATIONS = 3;

/** Default auto-dismiss delay in milliseconds */
export const DEFAULT_DISMISS_DELAY_MS = 8000;

/** Severity-based dismiss delays (critical stays longer) */
export const DISMISS_DELAYS: Record<ViolationSeverity, number> = {
  info: 5000,
  low: 6000,
  medium: 8000,
  high: 10000,
  critical: 15000,
};

// =============================================================================
// Types
// =============================================================================

interface ComplianceState {
  /** Active violations currently displayed or queued */
  violations: ComplianceViolation[];

  /** IDs of violations currently visible in the UI */
  visibleIds: Set<string>;

  // Actions
  addViolation: (violation: ComplianceViolation) => void;
  dismissViolation: (id: string) => void;
  dismissAll: () => void;
  clearViolations: () => void;

  // Derived helpers
  getVisibleViolations: () => ComplianceViolation[];
  getQueuedCount: () => number;
}

// =============================================================================
// Store
// =============================================================================

export const useComplianceStore = create<ComplianceState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      violations: [],
      visibleIds: new Set<string>(),

      // =========================================================================
      // Actions
      // =========================================================================

      addViolation: (violation) =>
        set((state) => {
          // Add to violations array (prepend for newest first)
          state.violations.unshift(violation);

          // If we have room, make it visible immediately
          if (state.visibleIds.size < MAX_VISIBLE_VIOLATIONS) {
            state.visibleIds.add(violation.id);
          }
        }),

      dismissViolation: (id) =>
        set((state) => {
          // Remove from visible
          state.visibleIds.delete(id);

          // Remove from violations array
          const index = state.violations.findIndex((v) => v.id === id);
          if (index !== -1) {
            state.violations.splice(index, 1);
          }

          // Promote next queued violation to visible if available
          const hiddenViolation = state.violations.find(
            (v) => !state.visibleIds.has(v.id)
          );
          if (hiddenViolation && state.visibleIds.size < MAX_VISIBLE_VIOLATIONS) {
            state.visibleIds.add(hiddenViolation.id);
          }
        }),

      dismissAll: () =>
        set((state) => {
          state.violations = [];
          state.visibleIds.clear();
        }),

      clearViolations: () =>
        set((state) => {
          state.violations = [];
          state.visibleIds.clear();
        }),

      // =========================================================================
      // Derived Helpers
      // =========================================================================

      getVisibleViolations: () => {
        const { violations, visibleIds } = get();
        return violations.filter((v) => visibleIds.has(v.id));
      },

      getQueuedCount: () => {
        const { violations, visibleIds } = get();
        return violations.length - visibleIds.size;
      },
    }))
  )
);

// =============================================================================
// Subscription Helpers
// =============================================================================

/**
 * Subscribe to visible violations changes
 */
export const subscribeToVisibleViolations = (
  callback: (violations: ComplianceViolation[]) => void
) => {
  return useComplianceStore.subscribe(
    (state) => state.getVisibleViolations(),
    callback,
    { equalityFn: (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i]?.id) }
  );
};

/**
 * Get dismiss delay for a violation based on severity
 */
export function getDismissDelay(severity: ViolationSeverity): number {
  return DISMISS_DELAYS[severity] ?? DEFAULT_DISMISS_DELAY_MS;
}
