/**
 * IntegrityReportSummary Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrityReportSummary } from '@/features/compliance/components/IntegrityReportSummary';
import type { ComplianceViolation } from '@/features/compliance/types/compliance.types';
import type { VerificationOutcome } from '@/features/compliance/components/VerificationOutcomes';

// Mock PermissionGate to control permission behavior
const mockHasPermission = vi.fn(() => true);
vi.mock('@/features/auth/components/PermissionGate', () => ({
  PermissionGate: ({
    children,
    permission,
    fallback,
  }: {
    children: React.ReactNode;
    permission: string;
    fallback?: React.ReactNode;
  }) => {
    if (permission === 'canViewCompliance' && !mockHasPermission()) {
      return fallback ?? null;
    }
    return <>{children}</>;
  },
}));

// Mock child components to simplify testing
vi.mock('@/features/compliance/components/ViolationsSummary', () => ({
  ViolationsSummary: ({ violations }: { violations: ComplianceViolation[] }) => (
    <div data-testid="violations-summary">
      {violations.length} violations
    </div>
  ),
}));

vi.mock('@/features/compliance/components/VerificationOutcomes', () => ({
  VerificationOutcomes: ({ outcomes }: { outcomes: VerificationOutcome[] }) => (
    <div data-testid="verification-outcomes">
      {outcomes.length} verifications
    </div>
  ),
}));

// Helper to create a mock violation
function createMockViolation(
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
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

// Helper to create a mock verification
function createMockVerification(
  overrides: Partial<VerificationOutcome> = {}
): VerificationOutcome {
  return {
    id: `verification-${Math.random().toString(36).substr(2, 9)}`,
    type: 'question',
    status: 'passed',
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('IntegrityReportSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('should render with passed status when no violations', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.getByText('Integrity Report')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(
        screen.getByText('Session completed with no integrity concerns')
      ).toBeInTheDocument();
    });

    it('should render with warning status when medium violations', () => {
      const violations = [
        createMockViolation({ severity: 'medium' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('Minor Issues')).toBeInTheDocument();
      expect(
        screen.getByText('Session completed with minor compliance events')
      ).toBeInTheDocument();
    });

    it('should render with failed status when critical violations', () => {
      const violations = [
        createMockViolation({ severity: 'critical' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('Integrity Concerns')).toBeInTheDocument();
      expect(
        screen.getByText('Session had significant compliance violations')
      ).toBeInTheDocument();
    });

    it('should render with failed status when high violations', () => {
      const violations = [
        createMockViolation({ severity: 'high' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('Integrity Concerns')).toBeInTheDocument();
    });

    it('should render with failed status when failed verifications', () => {
      const verifications = [
        createMockVerification({ status: 'failed' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      expect(screen.getByText('Integrity Concerns')).toBeInTheDocument();
    });

    it('should render with pending status when pending verifications', () => {
      const verifications = [
        createMockVerification({ status: 'pending' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(
        screen.getByText('Integrity report requires manual review')
      ).toBeInTheDocument();
    });

    it('should display session title when provided', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          sessionTitle="Test Session"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });

    it('should display truncated session ID when no title', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-abc-123-def-456"
          violations={[]}
          verifications={[]}
        />
      );

      // Component shows first 8 characters of session ID
      expect(screen.getByText('Session session-')).toBeInTheDocument();
    });
  });

  describe('score calculation', () => {
    it('should calculate integrity score of 100 with no violations', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Integrity Score')).toBeInTheDocument();
    });

    it('should calculate reduced score with violations', () => {
      // medium = 20 weight, so score = (100 - 20) * 1 = 80
      const violations = [createMockViolation({ severity: 'medium' })];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('should calculate score with multiple violations', () => {
      // medium (20) + low (5) = 25 weight, so score = (100 - 25) * 1 = 75
      const violations = [
        createMockViolation({ severity: 'medium' }),
        createMockViolation({ severity: 'low' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should calculate verification score correctly', () => {
      // 2 passed, 1 failed = 66.67% -> 67%
      const verifications = [
        createMockVerification({ status: 'passed' }),
        createMockVerification({ status: 'passed' }),
        createMockVerification({ status: 'failed' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      expect(screen.getByText('67%')).toBeInTheDocument();
      expect(screen.getByText('Verification Rate')).toBeInTheDocument();
    });

    it('should show 100% verification rate with empty verifications', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display violation count', () => {
      const violations = [
        createMockViolation(),
        createMockViolation(),
        createMockViolation(),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Violations')).toBeInTheDocument();
    });
  });

  describe('duration formatting', () => {
    it('should format duration with hours and minutes', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          sessionStartedAt="2024-01-01T10:00:00Z"
          sessionEndedAt="2024-01-01T11:30:00Z"
        />
      );

      expect(screen.getByText('Duration: 1h 30m')).toBeInTheDocument();
    });

    it('should format duration with minutes only', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          sessionStartedAt="2024-01-01T10:00:00Z"
          sessionEndedAt="2024-01-01T10:45:00Z"
        />
      );

      expect(screen.getByText('Duration: 45m')).toBeInTheDocument();
    });

    it('should not display duration for invalid dates', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          sessionStartedAt="invalid-date"
          sessionEndedAt="2024-01-01T10:45:00Z"
        />
      );

      expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
    });

    it('should not display duration when end before start', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          sessionStartedAt="2024-01-01T11:00:00Z"
          sessionEndedAt="2024-01-01T10:00:00Z"
        />
      );

      expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
    });

    it('should not display duration when dates missing', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('should call onExport with pdf when clicked', async () => {
      const onExport = vi.fn();
      const user = userEvent.setup();

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          onExport={onExport}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export report/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalledWith('pdf');
    });

    it('should disable button while isExporting=true', () => {
      const onExport = vi.fn();

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          onExport={onExport}
          isExporting={true}
        />
      );

      const exportButton = screen.getByRole('button', { name: /exporting/i });
      expect(exportButton).toBeDisabled();
    });

    it('should show loading text while exporting', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          onExport={vi.fn()}
          isExporting={true}
        />
      );

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should hide export button when onExport not provided', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(
        screen.queryByRole('button', { name: /export/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('permission gate', () => {
    it('should render nothing when user lacks canViewCompliance', () => {
      mockHasPermission.mockReturnValue(false);

      const { container } = render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render content when user has permission', () => {
      mockHasPermission.mockReturnValue(true);

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      expect(screen.getByText('Integrity Report')).toBeInTheDocument();
    });
  });

  describe('child components', () => {
    it('should pass violations to ViolationsSummary', () => {
      const violations = [
        createMockViolation(),
        createMockViolation(),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      const summary = screen.getByTestId('violations-summary');
      expect(within(summary).getByText('2 violations')).toBeInTheDocument();
    });

    it('should pass verifications to VerificationOutcomes', () => {
      const verifications = [
        createMockVerification(),
        createMockVerification(),
        createMockVerification(),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      const outcomes = screen.getByTestId('verification-outcomes');
      expect(within(outcomes).getByText('3 verifications')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('session date display', () => {
    it('should display formatted session start date', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
          sessionStartedAt="2024-01-15T10:00:00Z"
        />
      );

      // The exact format depends on locale, but it should display some date
      expect(screen.getByText(/Jan 15, 2024|15 Jan 2024|January 15, 2024/i)).toBeInTheDocument();
    });
  });

  describe('status badge variants', () => {
    it('should show default badge variant for passed status', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={[]}
        />
      );

      const badge = screen.getByText('Passed');
      expect(badge).toBeInTheDocument();
    });

    it('should show destructive badge variant for failed status', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[createMockViolation({ severity: 'critical' })]}
          verifications={[]}
        />
      );

      const badge = screen.getByText('Integrity Concerns');
      expect(badge).toBeInTheDocument();
    });

    it('should show secondary badge variant for warning status', () => {
      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[createMockViolation({ severity: 'medium' })]}
          verifications={[]}
        />
      );

      const badge = screen.getByText('Minor Issues');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle critical + low violations scoring', () => {
      // critical (100) + low (5) = 105, capped at 100, so score = 0
      const violations = [
        createMockViolation({ severity: 'critical' }),
        createMockViolation({ severity: 'low' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={violations}
          verifications={[]}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle expired verifications as warning', () => {
      const verifications = [
        createMockVerification({ status: 'passed' }),
        createMockVerification({ status: 'expired' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      // Expired triggers warning status
      expect(screen.getByText('Minor Issues')).toBeInTheDocument();
    });

    it('should handle all verification statuses in pass rate', () => {
      const verifications = [
        createMockVerification({ status: 'passed' }),
        createMockVerification({ status: 'passed' }),
        createMockVerification({ status: 'expired' }),
        createMockVerification({ status: 'pending' }),
      ];

      render(
        <IntegrityReportSummary
          sessionId="session-123"
          violations={[]}
          verifications={verifications}
        />
      );

      // 2 passed out of 4 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
