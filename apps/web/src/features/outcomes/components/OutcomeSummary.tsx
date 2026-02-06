/**
 * OutcomeSummary Component
 * Displays outcome summary information.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import type { OutcomeSummary as Summary } from '../types/outcomes.types';

interface OutcomeSummaryProps {
  summary: Summary;
}

export function OutcomeSummary({ summary }: OutcomeSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview */}
        <div>
          <p className="text-sm">{summary.overview}</p>
        </div>

        {/* Key Points */}
        {summary.keyPoints.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Key Points</p>
            <ul className="space-y-1">
              {summary.keyPoints.map((point, index) => (
                <li key={`item-${index}`} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Participant Highlights */}
        {summary.participantHighlights &&
          Object.keys(summary.participantHighlights).length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Participant Highlights</p>
              <div className="space-y-2">
                {Object.entries(summary.participantHighlights).map(
                  ([participant, highlight]) => (
                    <div
                      key={participant}
                      className="rounded-lg bg-muted/50 p-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {participant}
                      </p>
                      <p className="text-sm">{highlight}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
