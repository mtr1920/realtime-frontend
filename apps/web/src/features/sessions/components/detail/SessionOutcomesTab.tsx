/**
 * Session Outcomes Tab
 * Displays generated outcomes including summary, evaluation, and decision.
 * Fetches its own data via TanStack Query.
 */

import { useMemo, useCallback } from 'react';
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  ListChecks,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Progress,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/shared/ui';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { usePermissions } from '@/features/auth';
import { useSessionOutcome } from '@/features/outcomes/hooks/useSessionOutcome';
import { outcomesService } from '@/features/outcomes/api/outcomes.service';
import type { Outcome as ApiOutcome } from '@/features/outcomes/types/outcomes.types';

export type OutcomeStatus =
  | 'pending'
  | 'generating'
  | 'ready'
  | 'approved'
  | 'rejected'
  | 'failed';

interface OutcomeSummary {
  overview: string;
  keyPoints: string[];
  participantHighlights?: Record<string, string>;
  generatedAt: string;
  generatedBy: string;
}

interface CriteriaScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxScore: number;
  notes?: string;
}

interface OutcomeEvaluation {
  rubricId?: string;
  overallScore: number;
  maxScore: number;
  criteriaScores: CriteriaScore[];
  strengths: string[];
  improvements: string[];
  generatedAt: string;
  generatedBy: string;
}

interface OutcomeDecision {
  recommendation: 'proceed' | 'reject' | 'review';
  confidence: number;
  rationale: string;
  nextSteps: string[];
  generatedAt: string;
  generatedBy: string;
}

export interface SessionOutcome {
  id: string;
  status: OutcomeStatus;
  summary: OutcomeSummary | null;
  evaluation: OutcomeEvaluation | null;
  decision: OutcomeDecision | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionNote: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
}

interface SessionOutcomesTabProps {
  /** Session ID to fetch outcome for */
  sessionId: string;
}

// =============================================================================
// Mapping Helpers
// =============================================================================

/**
 * Format a criteria ID to a readable name.
 * Converts snake_case or camelCase to Title Case.
 */
function formatCriteriaName(criteriaId: string): string {
  return criteriaId
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Map backend recommendation string to view model enum.
 */
function mapRecommendation(recommendation: string): 'proceed' | 'reject' | 'review' {
  const normalized = recommendation.toLowerCase();
  if (normalized === 'proceed' || normalized === 'pass' || normalized === 'approve') {
    return 'proceed';
  }
  if (normalized === 'reject' || normalized === 'fail' || normalized === 'decline') {
    return 'reject';
  }
  return 'review';
}

/**
 * Map API outcome to the view model expected by SessionOutcomesTab.
 * Handles differences between API types and view model (provides defaults for missing fields).
 */
function mapOutcomeToView(response: ApiOutcome): SessionOutcome {
  // Calculate maxScore from sum of all criteria maxScores
  let maxScore = response.evaluation?.maxScore ?? 100;
  let criteriaScores: Array<{
    criteriaId: string;
    criteriaName: string;
    score: number;
    maxScore: number;
    notes?: string;
  }> = [];

  if (response.evaluation?.criteriaScores) {
    criteriaScores = Object.entries(response.evaluation.criteriaScores).map(
      ([criteriaId, score]) => ({
        criteriaId,
        criteriaName: formatCriteriaName(criteriaId),
        score: score.score,
        maxScore: score.maxScore,
        notes: score.feedback,
      })
    );
    // If no maxScore provided, sum from criteria
    if (!response.evaluation.maxScore) {
      maxScore = criteriaScores.reduce((sum, c) => sum + c.maxScore, 0);
    }
  }

  // Extract evaluation with extended API response (type assertion for fields not in base type)
  const evalResponse = response.evaluation as ApiOutcome['evaluation'] & {
    strengths?: string[];
    improvements?: string[];
    generatedAt?: string;
    generatedBy?: string;
  };

  // Extract decision with extended API response
  const decisionResponse = response.decision as ApiOutcome['decision'] & {
    generatedAt?: string;
    generatedBy?: string;
  };

  return {
    id: response.id,
    status: response.status,
    summary: response.summary
      ? {
          overview: response.summary.overview,
          keyPoints: response.summary.keyPoints,
          participantHighlights: response.summary.participantHighlights,
          generatedAt: response.generatedAt ?? new Date().toISOString(),
          generatedBy: 'AI',
        }
      : null,
    evaluation: evalResponse
      ? {
          rubricId: evalResponse.rubricId,
          overallScore: evalResponse.overallScore,
          maxScore,
          criteriaScores,
          strengths: evalResponse.strengths ?? [],
          improvements: evalResponse.improvements ?? [],
          generatedAt: evalResponse.generatedAt ?? response.generatedAt ?? new Date().toISOString(),
          generatedBy: evalResponse.generatedBy ?? 'AI',
        }
      : null,
    decision: decisionResponse
      ? {
          recommendation: mapRecommendation(decisionResponse.recommendation),
          confidence: decisionResponse.confidence,
          rationale: decisionResponse.rationale,
          nextSteps: decisionResponse.nextSteps ?? [],
          generatedAt: decisionResponse.generatedAt ?? response.generatedAt ?? new Date().toISOString(),
          generatedBy: decisionResponse.generatedBy ?? 'AI',
        }
      : null,
    approvedAt: response.approvedAt ?? null,
    approvedBy: response.approvedBy ?? null,
    rejectedAt: response.rejectedAt ?? null,
    rejectedBy: response.rejectedBy ?? null,
    rejectionNote: response.rejectionNote ?? null,
    errorMessage: null, // API type doesn't include errorMessage
    generatedAt: response.generatedAt ?? null,
  };
}

const STATUS_CONFIG: Record<
  OutcomeStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }
> = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  generating: {
    icon: Loader2,
    label: 'Generating',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  ready: {
    icon: CheckCircle2,
    label: 'Ready',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
};

type RecommendationType = 'proceed' | 'reject' | 'review';

const RECOMMENDATION_CONFIG: Record<
  RecommendationType,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  proceed: {
    icon: ThumbsUp,
    label: 'Proceed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  reject: {
    icon: ThumbsDown,
    label: 'Reject',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  review: {
    icon: AlertCircle,
    label: 'Needs Review',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
};

export function SessionOutcomesTab({ sessionId }: SessionOutcomesTabProps) {
  const { hasPermission } = usePermissions();

  // Fetch outcome for this session
  const { outcome: rawOutcome, isLoading, invalidate } = useSessionOutcome(sessionId);

  // Map API outcome to view model
  const outcome: SessionOutcome | null = useMemo(() => {
    if (!rawOutcome) return null;
    return mapOutcomeToView(rawOutcome);
  }, [rawOutcome]);

  const canApprove = hasPermission('canEndSession');

  const handleApprove = useCallback(async () => {
    try {
      await outcomesService.approve(sessionId);
      toast.success('Outcome approved');
      invalidate();
    } catch {
      toast.error('Failed to approve outcome');
    }
  }, [sessionId, invalidate]);

  const handleReject = useCallback(async (note?: string) => {
    try {
      await outcomesService.reject(sessionId, { note: note ?? '' });
      toast.success('Outcome rejected');
      invalidate();
    } catch {
      toast.error('Failed to reject outcome');
    }
  }, [sessionId, invalidate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!outcome) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6 text-muted-foreground" />}
        title="No outcome yet"
        description="Outcomes will be generated after the session is completed."
      />
    );
  }

  const statusConfig = STATUS_CONFIG[outcome.status];
  const StatusIcon = statusConfig.icon;
  const isGenerating = outcome.status === 'generating';
  const isPendingApproval = outcome.status === 'ready' && canApprove;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn('gap-1.5 text-sm py-1.5 px-3', statusConfig.color)}
        >
          <StatusIcon
            className={cn('h-4 w-4', isGenerating && 'animate-spin')}
          />
          {statusConfig.label}
        </Badge>

        {isPendingApproval && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleReject('No reason provided')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button size="sm" onClick={() => void handleApprove()}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {outcome.status === 'failed' && outcome.errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{outcome.errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Rejection Note */}
      {outcome.status === 'rejected' && outcome.rejectionNote && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Rejected</AlertTitle>
          <AlertDescription>{outcome.rejectionNote}</AlertDescription>
        </Alert>
      )}

      {/* Summary Section */}
      {outcome.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{outcome.summary.overview}</p>

            {outcome.summary.keyPoints.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Key Points
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {outcome.summary.keyPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {outcome.summary.participantHighlights &&
              Object.keys(outcome.summary.participantHighlights).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Participant Highlights</h4>
                    <div className="space-y-2">
                      {Object.entries(outcome.summary.participantHighlights).map(
                        ([participant, highlight]) => (
                          <div key={participant} className="text-sm">
                            <span className="font-medium">{participant}:</span>{' '}
                            <span className="text-muted-foreground">{highlight}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
          </CardContent>
        </Card>
      )}

      {/* Evaluation Section */}
      {outcome.evaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evaluation
            </CardTitle>
            <CardDescription>
              Overall Score: {outcome.evaluation.overallScore} / {outcome.evaluation.maxScore}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Performance</span>
                <span className="font-medium">
                  {Math.round((outcome.evaluation.overallScore / outcome.evaluation.maxScore) * 100)}%
                </span>
              </div>
              <Progress
                value={(outcome.evaluation.overallScore / outcome.evaluation.maxScore) * 100}
              />
            </div>

            {/* Criteria Breakdown */}
            {outcome.evaluation.criteriaScores.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">Criteria Breakdown</h4>
                  <div className="space-y-3">
                    {outcome.evaluation.criteriaScores.map((criteria) => (
                      <div key={criteria.criteriaId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{criteria.criteriaName}</span>
                          <span className="font-medium">
                            {criteria.score} / {criteria.maxScore}
                          </span>
                        </div>
                        <Progress
                          value={(criteria.score / criteria.maxScore) * 100}
                          className="h-2"
                        />
                        {criteria.notes && (
                          <p className="text-xs text-muted-foreground">{criteria.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Strengths & Improvements */}
            <div className="grid gap-4 md:grid-cols-2">
              {outcome.evaluation.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    Strengths
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {outcome.evaluation.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {outcome.evaluation.improvements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-amber-600">
                    <TrendingDown className="h-4 w-4" />
                    Areas for Improvement
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {outcome.evaluation.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Section */}
      {outcome.decision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommendation */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recommendation</span>
              {(() => {
                const config = RECOMMENDATION_CONFIG[outcome.decision.recommendation];
                const Icon = config.icon;
                return (
                  <Badge variant="outline" className={cn('gap-1.5', config.color)}>
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </Badge>
                );
              })()}
            </div>

            {/* Confidence */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span className="font-medium">{outcome.decision.confidence}%</span>
              </div>
              <Progress value={outcome.decision.confidence} />
            </div>

            <Separator />

            {/* Rationale */}
            <div>
              <h4 className="text-sm font-medium mb-2">Rationale</h4>
              <p className="text-sm text-muted-foreground">{outcome.decision.rationale}</p>
            </div>

            {/* Next Steps */}
            {outcome.decision.nextSteps.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {outcome.decision.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
