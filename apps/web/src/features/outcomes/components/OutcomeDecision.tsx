/**
 * OutcomeDecision Component
 * Displays AI-generated decision recommendation.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import type { OutcomeDecision as Decision } from '../types/outcomes.types';

interface OutcomeDecisionProps {
  decision: Decision;
}

export function OutcomeDecision({ decision }: OutcomeDecisionProps) {
  const confidencePercentage = Math.round(decision.confidence * 100);

  const getConfidenceVariant = (): 'default' | 'success' | 'secondary' => {
    if (confidencePercentage >= 80) return 'success';
    if (confidencePercentage >= 60) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendation */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-semibold">{decision.recommendation}</p>
            <Badge variant={getConfidenceVariant()}>
              {confidencePercentage}% confidence
            </Badge>
          </div>
        </div>

        {/* Rationale */}
        <div>
          <p className="text-sm font-medium mb-2">Rationale</p>
          <p className="text-sm text-muted-foreground">{decision.rationale}</p>
        </div>

        {/* Next Steps */}
        {decision.nextSteps && decision.nextSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recommended Next Steps</p>
            <ol className="space-y-2">
              {decision.nextSteps.map((step, index) => (
                <li key={`item-${index}`} className="flex gap-2 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
