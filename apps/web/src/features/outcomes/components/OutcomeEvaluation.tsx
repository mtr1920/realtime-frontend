/**
 * OutcomeEvaluation Component
 * Displays outcome evaluation scores.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import type { OutcomeEvaluation as Evaluation } from '../types/outcomes.types';

interface OutcomeEvaluationProps {
  evaluation: Evaluation;
}

export function OutcomeEvaluation({ evaluation }: OutcomeEvaluationProps) {
  const overallPercentage = evaluation.maxScore
    ? Math.round((evaluation.overallScore / evaluation.maxScore) * 100)
    : evaluation.overallScore;

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-6 rounded-lg bg-muted/50">
          <p className="text-4xl font-bold">{overallPercentage}%</p>
          <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
          {evaluation.rubricName && (
            <p className="text-xs text-muted-foreground mt-2">
              Based on: {evaluation.rubricName}
            </p>
          )}
        </div>

        {/* Criteria Scores */}
        {Object.keys(evaluation.criteriaScores).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Criteria Breakdown</p>
            <div className="space-y-3">
              {Object.entries(evaluation.criteriaScores).map(
                ([criterion, score]) => {
                  const percentage = Math.round(
                    (score.score / score.maxScore) * 100
                  );
                  return (
                    <div key={criterion}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{criterion}</span>
                        <span
                          className={`text-sm font-medium ${getScoreColor(
                            score.score,
                            score.maxScore
                          )}`}
                        >
                          {score.score}/{score.maxScore} ({percentage}%)
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage >= 80
                              ? 'bg-green-500'
                              : percentage >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                          role="progressbar"
                          aria-valuenow={score.score}
                          aria-valuemax={score.maxScore}
                          aria-label={`${criterion}: ${percentage}%`}
                        />
                      </div>
                      {score.feedback && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {score.feedback}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
