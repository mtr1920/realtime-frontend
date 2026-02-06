/**
 * OutcomeCard Component
 * Displays an outcome card in the list.
 */

import { Button } from '@/shared/ui';
import { Card, CardContent } from '@/shared/ui';
import { OutcomeStatusBadge } from './OutcomeStatusBadge';
import type { Outcome } from '../types/outcomes.types';

interface OutcomeCardProps {
  outcome: Outcome;
  onView: (outcome: Outcome) => void;
}

export function OutcomeCard({ outcome, onView }: OutcomeCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreDisplay = () => {
    if (!outcome.evaluation) return null;
    const { overallScore, maxScore } = outcome.evaluation;
    const percentage = maxScore ? Math.round((overallScore / maxScore) * 100) : overallScore;
    return `${percentage}%`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <OutcomeStatusBadge status={outcome.status} />
              {outcome.integrity?.status === 'violation' && (
                <span className="text-xs text-destructive font-medium">
                  Integrity Issue
                </span>
              )}
            </div>
            <p className="font-medium truncate">
              {outcome.sessionTitle || `Session ${outcome.sessionId.slice(0, 8)}...`}
            </p>
            {outcome.workspaceName && (
              <p className="text-sm text-muted-foreground truncate">
                {outcome.workspaceName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(outcome.createdAt)}
            </p>
          </div>

          {/* Score */}
          {outcome.evaluation && (
            <div className="text-center px-4">
              <p className="text-2xl font-bold">{getScoreDisplay()}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
          )}

          {/* Decision */}
          {outcome.decision && (
            <div className="max-w-[150px]">
              <p className="text-sm font-medium truncate">
                {outcome.decision.recommendation}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(outcome.decision.confidence * 100)}% confidence
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(outcome)}
              aria-label={`View outcome for session ${outcome.sessionId}`}
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
