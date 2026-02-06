/**
 * OutcomeList Component
 * Displays a list of outcome cards.
 */

import { OutcomeCard } from './OutcomeCard';
import type { Outcome } from '../types/outcomes.types';

interface OutcomeListProps {
  outcomes: Outcome[];
  isLoading?: boolean;
  onView: (outcome: Outcome) => void;
}

export function OutcomeList({
  outcomes,
  isLoading = false,
  onView,
}: OutcomeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={`skeleton-${i}`}
            className="h-24 motion-safe:animate-pulse rounded-lg bg-muted"
            aria-label="Loading outcome"
          />
        ))}
      </div>
    );
  }

  if (outcomes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-lg font-medium">No outcomes found</p>
        <p className="text-sm text-muted-foreground">
          Outcomes will appear here after sessions are completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outcomes.map((outcome) => (
        <OutcomeCard key={outcome.id} outcome={outcome} onView={onView} />
      ))}
    </div>
  );
}
