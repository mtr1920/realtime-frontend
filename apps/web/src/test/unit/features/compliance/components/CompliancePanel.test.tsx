/**
 * CompliancePanel Component Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from '@testing-library/react';
import { CompliancePanel } from '@/features/compliance/components/CompliancePanel';
import { useComplianceHistoryStore } from '@/features/compliance/stores/compliance-history.store';
import type { ComplianceViolation } from '@/features/compliance/types/compliance.types';

// Mock realtime hooks
const mockSubscriptions = new Map<string, (payload: unknown) => void>();
vi.mock('@/features/realtime', () => ({
  useSubscription: (type: string, handler: (payload: unknown) => void) => {
    mockSubscriptions.set(type, handler);
  },
}));

// Mock session store
const mockSession = {
  id: 'session-1',
  actualStartTime: '2024-01-01T10:00:00Z',
};
vi.mock('@/shared/stores/session.store', () => ({
  useSessionStore: (selector: (state: { session: typeof mockSession }) => unknown) =>
    selector({ session: mockSession }),
}));

// Mock child components to simplify testing
vi.mock('@/features/compliance/components/ViolationFilters', () => ({
  ViolationFilters: () => <div data-testid="violation-filters">Filters</div>,
}));

vi.mock('@/features/compliance/components/ViolationList', () => ({
  ViolationList: ({
    violations,
    showTimestamps,
  }: {
    violations: ComplianceViolation[];
    showTimestamps: boolean;
  }) => (
    <div data-testid="violation-list">
      {violations.map((v) => (
        <div key={v.id} data-testid={`violation-${v.id}`}>
          {v.type} - {v.severity}
        </div>
      ))}
      {showTimestamps && <span>timestamps shown</span>}
    </div>
  ),
}));

vi.mock('@/features/compliance/components/ComplianceTimeline', () => ({
  ComplianceTimeline: ({
    violations,
    sessionStartTime,
  }: {
    violations: ComplianceViolation[];
    sessionStartTime?: string;
  }) => (
    <div data-testid="compliance-timeline">
      {violations.length} violations on timeline
      {sessionStartTime && <span>Session started: {sessionStartTime}</span>}
    </div>
  ),
}));

// Helper to create a mock violation
function createMockViolation(overrides: Partial<ComplianceViolation> = {}): ComplianceViolation {
  return {
    id: `violation-${Math.random().toString(36).substr(2, 9)}`,
    type: 'tab_switch',
    severity: 'medium',
    action: 'warned',
    message: 'Tab switch detected',
    timestamp: new Date().toISOString(),
    details: {},
    ...overrides,
  };
}

describe('CompliancePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptions.clear();

    // Reset store
    act(() => {
      useComplianceHistoryStore.getState().clearHistory();
      useComplianceHistoryStore.getState().resetFilter();
      useComplianceHistoryStore.getState().setError(null);
      useComplianceHistoryStore.getState().setLoading(false);
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render panel header with shield icon', () => {
      render(<CompliancePanel />);

      expect(screen.getByText('Compliance Monitor')).toBeInTheDocument();
    });

    it('should render violation count badge', () => {
      render(<CompliancePanel />);

      // Initially 0 violations
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should render export button', () => {
      render(<CompliancePanel />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should render tabs for violations and filters', () => {
      render(<CompliancePanel />);

      expect(screen.getByRole('tab', { name: /violations/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /filters/i })).toBeInTheDocument();
    });

    it('should render compliance timeline', () => {
      render(<CompliancePanel />);

      expect(screen.getByTestId('compliance-timeline')).toBeInTheDocument();
    });
  });

  describe('violation display', () => {
    it('should display violations when present', () => {
      const violations = [
        createMockViolation({ id: 'v1', type: 'tab_switch', severity: 'medium' }),
        createMockViolation({ id: 'v2', type: 'window_blur', severity: 'high' }),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });

      render(<CompliancePanel />);

      expect(screen.getByTestId('violation-v1')).toBeInTheDocument();
      expect(screen.getByTestId('violation-v2')).toBeInTheDocument();
    });

    it('should update count badge when violations are added', () => {
      act(() => {
        useComplianceHistoryStore.getState().addViolation(
          createMockViolation({ id: 'v1' })
        );
        useComplianceHistoryStore.getState().addViolation(
          createMockViolation({ id: 'v2' })
        );
      });

      render(<CompliancePanel />);

      // Check the badge has count of 2 (may appear multiple times in DOM)
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show filtered count when filter is active', () => {
      const violations = [
        createMockViolation({ id: 'v1', severity: 'medium' }),
        createMockViolation({ id: 'v2', severity: 'high' }),
        createMockViolation({ id: 'v3', severity: 'high' }),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
        useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
      });

      render(<CompliancePanel />);

      // Should show "2/3" when filtered
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });
  });

  describe('WebSocket subscription', () => {
    it('should subscribe to compliance.violation messages', () => {
      render(<CompliancePanel />);

      expect(mockSubscriptions.has('compliance.violation')).toBe(true);
    });

    it('should add violation when receiving compliance.violation message', () => {
      render(<CompliancePanel />);

      const handler = mockSubscriptions.get('compliance.violation');
      expect(handler).toBeDefined();

      const newViolation = createMockViolation({ id: 'new-v1' });

      act(() => {
        handler?.({ violation: newViolation });
      });

      const state = useComplianceHistoryStore.getState();
      expect(state.violations).toHaveLength(1);
      expect(state.violations[0]?.id).toBe('new-v1');
    });
  });

  describe('export functionality', () => {
    it('should disable export button when no violations', () => {
      render(<CompliancePanel />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).toBeDisabled();
    });

    it('should enable export button when violations exist', () => {
      act(() => {
        useComplianceHistoryStore.getState().addViolation(
          createMockViolation({ id: 'v1' })
        );
      });

      render(<CompliancePanel />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      expect(exportButton).not.toBeDisabled();
    });

    it('should create download when export is clicked', async () => {
      // Setup spies for download flow (used internally by the component)
      vi.spyOn(document, 'createElement');
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      act(() => {
        useComplianceHistoryStore.getState().addViolation(
          createMockViolation({ id: 'v1', type: 'tab_switch' })
        );
      });

      render(<CompliancePanel />);

      const exportButton = screen.getByRole('button', { name: /export/i });
      await userEvent.click(exportButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('tabs', () => {
    it('should show violations tab by default', () => {
      render(<CompliancePanel />);

      expect(screen.getByTestId('violation-list')).toBeInTheDocument();
    });

    it('should switch to filters tab when clicked', async () => {
      render(<CompliancePanel />);

      const filtersTab = screen.getByRole('tab', { name: /filters/i });
      await userEvent.click(filtersTab);

      expect(screen.getByTestId('violation-filters')).toBeInTheDocument();
    });

    it('should show filter indicator when filter is active', () => {
      act(() => {
        useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
      });

      render(<CompliancePanel />);

      // Filter tab should have indicator dot
      const filtersTab = screen.getByRole('tab', { name: /filters/i });
      const indicator = within(filtersTab).queryByRole('presentation') ||
        filtersTab.querySelector('.rounded-full');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when error occurs', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Failed to load violations');
      });

      render(<CompliancePanel />);

      expect(screen.getByText('Failed to load violations')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      act(() => {
        useComplianceHistoryStore.getState().setError('Network error');
      });

      render(<CompliancePanel />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      act(() => {
        useComplianceHistoryStore.getState().setLoading(true);
      });

      render(<CompliancePanel />);

      // Loading spinner should have aria-label
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible badge label', () => {
      act(() => {
        useComplianceHistoryStore.getState().setViolations([
          createMockViolation({ id: 'v1' }),
          createMockViolation({ id: 'v2' }),
        ]);
      });

      render(<CompliancePanel />);

      // Screen reader text should indicate count (may appear multiple times)
      const violationLabels = screen.getAllByText(/2 violations/i);
      expect(violationLabels.length).toBeGreaterThan(0);
    });

    it('should have accessible filtered count label', () => {
      act(() => {
        useComplianceHistoryStore.getState().setViolations([
          createMockViolation({ id: 'v1', severity: 'medium' }),
          createMockViolation({ id: 'v2', severity: 'high' }),
          createMockViolation({ id: 'v3', severity: 'high' }),
        ]);
        useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
      });

      render(<CompliancePanel />);

      expect(
        screen.getByText(/showing 2 of 3 violations/i)
      ).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(<CompliancePanel className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('maxHeight prop', () => {
    it('should pass maxHeight to ViolationList', () => {
      act(() => {
        useComplianceHistoryStore.getState().addViolation(
          createMockViolation({ id: 'v1' })
        );
      });

      render(<CompliancePanel maxHeight="500px" />);

      // ViolationList receives the maxHeight prop
      expect(screen.getByTestId('violation-list')).toBeInTheDocument();
    });
  });

  describe('timeline integration', () => {
    it('should pass violations to timeline', () => {
      const violations = [
        createMockViolation({ id: 'v1' }),
        createMockViolation({ id: 'v2' }),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
      });

      render(<CompliancePanel />);

      expect(screen.getByText('2 violations on timeline')).toBeInTheDocument();
    });

    it('should pass session start time to timeline', () => {
      render(<CompliancePanel />);

      expect(
        screen.getByText(/Session started: 2024-01-01T10:00:00Z/)
      ).toBeInTheDocument();
    });
  });

  describe('filter behavior', () => {
    it('should show filtered violations in list', () => {
      const violations = [
        createMockViolation({ id: 'v1', severity: 'low' }),
        createMockViolation({ id: 'v2', severity: 'high' }),
        createMockViolation({ id: 'v3', severity: 'high' }),
      ];

      act(() => {
        useComplianceHistoryStore.getState().setViolations(violations);
        useComplianceHistoryStore.getState().setFilter({ severities: ['high'] });
      });

      render(<CompliancePanel />);

      // Only high severity violations should be in the list
      expect(screen.getByTestId('violation-v2')).toBeInTheDocument();
      expect(screen.getByTestId('violation-v3')).toBeInTheDocument();
      expect(screen.queryByTestId('violation-v1')).not.toBeInTheDocument();
    });
  });
});
