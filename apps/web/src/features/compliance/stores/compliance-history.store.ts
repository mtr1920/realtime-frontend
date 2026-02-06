/**
 * Compliance History Store
 *
 * Zustand store for maintaining the complete violation history.
 * Used by observers/moderators to review all violations in a session.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ComplianceViolation, ViolationSeverity, ViolationType } from '../types/compliance.types';

// =============================================================================
// Types
// =============================================================================

export interface ViolationFilter {
  /** Filter by severity levels */
  severities: ViolationSeverity[];
  /** Filter by violation types */
  types: ViolationType[];
  /** Filter by participant ID */
  participantId?: string;
  /** Filter by time range (ISO strings) */
  timeRange?: {
    start?: string;
    end?: string;
  };
}

interface ComplianceHistoryState {
  /** All violations in the session */
  violations: ComplianceViolation[];

  /** Current filter settings */
  filter: ViolationFilter;

  /** Whether currently loading history */
  isLoading: boolean;

  /** Error message if loading failed */
  error: string | null;

  // Actions
  addViolation: (violation: ComplianceViolation) => void;
  setViolations: (violations: ComplianceViolation[]) => void;
  clearHistory: () => void;
  setFilter: (filter: Partial<ViolationFilter>) => void;
  resetFilter: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Derived
  getFilteredViolations: () => ComplianceViolation[];
  getViolationsBySeverity: () => Record<ViolationSeverity, number>;
  getViolationsByType: () => Record<ViolationType, number>;
  getViolationsByParticipant: () => Record<string, number>;
}

// =============================================================================
// Initial State
// =============================================================================

const initialFilter: ViolationFilter = {
  severities: [],
  types: [],
  participantId: undefined,
  timeRange: undefined,
};

// =============================================================================
// Store
// =============================================================================

export const useComplianceHistoryStore = create<ComplianceHistoryState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      violations: [],
      filter: initialFilter,
      isLoading: false,
      error: null,

      // =========================================================================
      // Actions
      // =========================================================================

      addViolation: (violation) =>
        set((state) => {
          // Add to history (newest first)
          state.violations.unshift(violation);
        }),

      setViolations: (violations) =>
        set((state) => {
          state.violations = violations;
          state.isLoading = false;
          state.error = null;
        }),

      clearHistory: () =>
        set((state) => {
          state.violations = [];
          state.error = null;
        }),

      setFilter: (filterUpdate) =>
        set((state) => {
          state.filter = { ...state.filter, ...filterUpdate };
        }),

      resetFilter: () =>
        set((state) => {
          state.filter = initialFilter;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
        }),

      // =========================================================================
      // Derived
      // =========================================================================

      getFilteredViolations: () => {
        const { violations, filter } = get();
        let filtered = [...violations];

        // Filter by severity
        if (filter.severities.length > 0) {
          filtered = filtered.filter((v) => filter.severities.includes(v.severity));
        }

        // Filter by type
        if (filter.types.length > 0) {
          filtered = filtered.filter((v) => filter.types.includes(v.type));
        }

        // Filter by participant
        if (filter.participantId) {
          filtered = filtered.filter(
            (v) => v.details?.participantId === filter.participantId
          );
        }

        // Filter by time range
        if (filter.timeRange?.start) {
          const startTime = new Date(filter.timeRange.start).getTime();
          filtered = filtered.filter(
            (v) => new Date(v.timestamp).getTime() >= startTime
          );
        }
        if (filter.timeRange?.end) {
          const endTime = new Date(filter.timeRange.end).getTime();
          filtered = filtered.filter(
            (v) => new Date(v.timestamp).getTime() <= endTime
          );
        }

        return filtered;
      },

      getViolationsBySeverity: () => {
        const { violations } = get();
        const counts: Record<ViolationSeverity, number> = {
          info: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        };
        violations.forEach((v) => {
          counts[v.severity]++;
        });
        return counts;
      },

      getViolationsByType: () => {
        const { violations } = get();
        const counts: Record<string, number> = {};
        violations.forEach((v) => {
          counts[v.type] = (counts[v.type] || 0) + 1;
        });
        return counts as Record<ViolationType, number>;
      },

      getViolationsByParticipant: () => {
        const { violations } = get();
        const counts: Record<string, number> = {};
        violations.forEach((v) => {
          const participantId = v.details?.participantId as string | undefined;
          if (participantId) {
            counts[participantId] = (counts[participantId] || 0) + 1;
          }
        });
        return counts;
      },
    }))
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectViolationsCount = (state: ComplianceHistoryState) => state.violations.length;

export const selectFilteredViolations = (state: ComplianceHistoryState) =>
  state.getFilteredViolations();

export const selectHasActiveFilter = (state: ComplianceHistoryState) =>
  state.filter.severities.length > 0 ||
  state.filter.types.length > 0 ||
  state.filter.participantId !== undefined ||
  state.filter.timeRange !== undefined;
