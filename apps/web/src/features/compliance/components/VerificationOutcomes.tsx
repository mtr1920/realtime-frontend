/**
 * VerificationOutcomes Component
 *
 * Displays identity verification outcomes for a session.
 * Shows passed/failed/pending verification challenges.
 */

import { useMemo } from 'react';
import { ShieldCheck, ShieldX, ShieldQuestion, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type VerificationStatus = 'passed' | 'failed' | 'expired' | 'pending';

export interface VerificationOutcome {
  /** Unique identifier for this verification */
  id: string;
  /** Type of verification challenge */
  type: 'question' | 'biometric' | 'photo' | 'document';
  /** Result of the verification */
  status: VerificationStatus;
  /** ISO 8601 timestamp of when verification was requested */
  requestedAt: string;
  /** ISO 8601 timestamp of when verification was completed */
  completedAt?: string;
  /** Time taken to respond in seconds */
  responseTimeSeconds?: number;
}

export interface VerificationOutcomesProps {
  /** Verification outcomes to display */
  outcomes: VerificationOutcome[];
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_CONFIG: Record<VerificationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof ShieldCheck;
}> = {
  passed: {
    label: 'Passed',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
    icon: ShieldCheck,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
    icon: ShieldX,
  },
  expired: {
    label: 'Expired',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    icon: Clock,
  },
  pending: {
    label: 'Pending',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/50',
    icon: ShieldQuestion,
  },
};

const TYPE_LABELS: Record<VerificationOutcome['type'], string> = {
  question: 'Security Question',
  biometric: 'Biometric Check',
  photo: 'Photo Verification',
  document: 'Document Verification',
};

// =============================================================================
// Component
// =============================================================================

/**
 * Summary of identity verification outcomes
 *
 * @example
 * ```tsx
 * <VerificationOutcomes outcomes={sessionVerifications} />
 * ```
 */
export function VerificationOutcomes({ outcomes, className }: VerificationOutcomesProps) {
  const { statusCounts, total } = useMemo(() => {
    const counts: Record<VerificationStatus, number> = {
      passed: 0,
      failed: 0,
      expired: 0,
      pending: 0,
    };

    outcomes.forEach((o) => {
      counts[o.status]++;
    });

    return {
      statusCounts: counts,
      total: outcomes.length,
    };
  }, [outcomes]);

  // Calculate pass rate
  const passRate = total > 0
    ? Math.round((statusCounts.passed / total) * 100)
    : 0;

  // Determine overall status
  const overallStatus: 'passed' | 'warning' | 'failed' | 'none' = useMemo(() => {
    if (total === 0) return 'none';
    if (statusCounts.failed > 0) return 'failed';
    if (statusCounts.expired > 0) return 'warning';
    if (statusCounts.passed === total) return 'passed';
    return 'warning';
  }, [statusCounts, total]);

  if (total === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ShieldQuestion className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No Verifications</p>
          <p className="text-xs text-muted-foreground">
            No identity challenges were issued
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Identity Verification
          <Badge
            variant={overallStatus === 'passed' ? 'default' : overallStatus === 'failed' ? 'destructive' : 'secondary'}
            className="ml-auto"
          >
            {passRate}% pass rate
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          {(['passed', 'failed', 'expired', 'pending'] as VerificationStatus[])
            .filter((status) => statusCounts[status] > 0)
            .map((status) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const count = statusCounts[status];

              return (
                <div
                  key={status}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md',
                    config.bgColor,
                    config.color
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs">{config.label}</span>
                </div>
              );
            })}
        </div>

        {/* Individual Outcomes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Verification History
          </p>
          <div className="space-y-2">
            {outcomes.map((outcome) => {
              const config = STATUS_CONFIG[outcome.status];
              const Icon = config.icon;

              return (
                <div
                  key={outcome.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md',
                    config.bgColor
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', config.color)} />
                    <div>
                      <p className="text-sm font-medium">
                        {TYPE_LABELS[outcome.type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(outcome.requestedAt).toLocaleTimeString()}
                        {outcome.responseTimeSeconds !== undefined && (
                          <span className="ml-2">
                            ({outcome.responseTimeSeconds}s)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
