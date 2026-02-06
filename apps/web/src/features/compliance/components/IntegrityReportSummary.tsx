/**
 * IntegrityReportSummary Component
 *
 * Complete compliance integrity report for post-session review.
 * Combines violation summary and verification outcomes with overall status.
 */

import { useMemo } from 'react';
import { FileCheck, AlertTriangle, CheckCircle, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import { cn } from '@/shared/lib/utils';
import { ViolationsSummary } from './ViolationsSummary';
import { VerificationOutcomes, type VerificationOutcome } from './VerificationOutcomes';
import type { ComplianceViolation, ViolationSeverity } from '../types/compliance.types';

// =============================================================================
// Types
// =============================================================================

export type IntegrityStatus = 'passed' | 'warning' | 'failed' | 'pending';

export interface IntegrityReportSummaryProps {
  /** Session identifier */
  sessionId: string;
  /** Session title for display */
  sessionTitle?: string;
  /** Compliance violations from the session */
  violations: ComplianceViolation[];
  /** Identity verification outcomes */
  verifications: VerificationOutcome[];
  /** ISO 8601 timestamp of when session started */
  sessionStartedAt?: string;
  /** ISO 8601 timestamp of when session ended */
  sessionEndedAt?: string;
  /** Callback to export report (optional) */
  onExport?: (format: 'json' | 'pdf') => void;
  /** Loading state for export */
  isExporting?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_CONFIG: Record<IntegrityStatus, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
}> = {
  passed: {
    label: 'Passed',
    description: 'Session completed with no integrity concerns',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900',
    icon: CheckCircle,
  },
  warning: {
    label: 'Minor Issues',
    description: 'Session completed with minor compliance events',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900',
    icon: AlertTriangle,
  },
  failed: {
    label: 'Integrity Concerns',
    description: 'Session had significant compliance violations',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900',
    icon: XCircle,
  },
  pending: {
    label: 'Pending Review',
    description: 'Integrity report requires manual review',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-900',
    icon: FileCheck,
  },
};

// Severity weights for scoring
const SEVERITY_WEIGHTS: Record<ViolationSeverity, number> = {
  critical: 100,
  high: 50,
  medium: 20,
  low: 5,
  info: 1,
};

// =============================================================================
// Component
// =============================================================================

/**
 * Complete integrity report summary for post-session review
 *
 * @example
 * ```tsx
 * <PermissionGate permission="canViewCompliance">
 *   <IntegrityReportSummary
 *     sessionId={session.id}
 *     sessionTitle={session.title}
 *     violations={violations}
 *     verifications={verifications}
 *     onExport={handleExport}
 *   />
 * </PermissionGate>
 * ```
 */
export function IntegrityReportSummary({
  sessionId,
  sessionTitle,
  violations,
  verifications,
  sessionStartedAt,
  sessionEndedAt,
  onExport,
  isExporting = false,
  className,
}: IntegrityReportSummaryProps) {
  // Calculate overall integrity status
  const { status, score, verificationScore } = useMemo(() => {
    // Calculate violation score (lower is better, 0 is perfect)
    const vScore = violations.reduce(
      (sum, v) => sum + SEVERITY_WEIGHTS[v.severity],
      0
    );

    // Calculate verification score (higher is better, 100 is perfect)
    const passedVerifications = verifications.filter((v) => v.status === 'passed').length;
    const failedVerifications = verifications.filter((v) => v.status === 'failed').length;
    const vfScore = verifications.length > 0
      ? Math.round((passedVerifications / verifications.length) * 100)
      : 100;

    // Determine overall status
    let overallStatus: IntegrityStatus = 'passed';

    // Failed if: any critical/high violations OR any failed verifications
    if (vScore >= 50 || failedVerifications > 0) {
      overallStatus = 'failed';
    }
    // Warning if: medium violations OR expired verifications
    else if (vScore >= 20 || verifications.some((v) => v.status === 'expired')) {
      overallStatus = 'warning';
    }
    // Pending if: pending verifications
    else if (verifications.some((v) => v.status === 'pending')) {
      overallStatus = 'pending';
    }

    // Overall score (0-100, higher is better)
    const overallScore = Math.max(0, 100 - Math.min(vScore, 100)) * (vfScore / 100);

    return {
      status: overallStatus,
      score: Math.round(overallScore),
      verificationScore: vfScore,
    };
  }, [violations, verifications]);

  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // Format session duration with validation
  const duration = useMemo(() => {
    if (!sessionStartedAt || !sessionEndedAt) return null;

    try {
      const start = new Date(sessionStartedAt);
      const end = new Date(sessionEndedAt);

      // Validate dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }

      const diffMs = end.getTime() - start.getTime();

      // Handle invalid duration (end before start)
      if (diffMs < 0) return null;

      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return hours > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${minutes}m`;
    } catch {
      return null;
    }
  }, [sessionStartedAt, sessionEndedAt]);

  return (
    <PermissionGate permission="canViewCompliance" fallback={null}>
      <div className={cn('space-y-4', className)}>
        {/* Header Card with Overall Status */}
        <Card className={cn('border-2', config.bgColor)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  config.bgColor
                )}>
                  <StatusIcon className={cn('h-6 w-6', config.color)} />
                </div>
                <div>
                  <CardTitle className="text-lg">Integrity Report</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {sessionTitle || `Session ${sessionId.slice(0, 8)}`}
                  </p>
                </div>
              </div>
              <Badge variant={status === 'passed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}>
                {config.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status Description */}
            <p className={cn('text-sm', config.color)}>
              {config.description}
            </p>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{score}</p>
                <p className="text-xs text-muted-foreground">Integrity Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{violations.length}</p>
                <p className="text-xs text-muted-foreground">Violations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{verificationScore}%</p>
                <p className="text-xs text-muted-foreground">Verification Rate</p>
              </div>
            </div>

            {/* Session Info */}
            {(sessionStartedAt || duration) && (
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                {sessionStartedAt && (
                  <span>
                    {new Date(sessionStartedAt).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </span>
                )}
                {duration && <span>Duration: {duration}</span>}
              </div>
            )}

            {/* Export Button */}
            {onExport && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('pdf')}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Report'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <ViolationsSummary violations={violations} />
          <VerificationOutcomes outcomes={verifications} />
        </div>
      </div>
    </PermissionGate>
  );
}
