/**
 * OutcomeStatusBadge Component
 * Displays outcome status as a badge.
 */

import { Badge } from '@/shared/ui';
import { outcomeStatusLabels, type OutcomeStatus } from '../types/outcomes.types';

interface OutcomeStatusBadgeProps {
  status: OutcomeStatus;
}

export function OutcomeStatusBadge({ status }: OutcomeStatusBadgeProps) {
  const getVariant = (): 'default' | 'success' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
      case 'failed':
        return 'destructive';
      case 'ready':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant()} aria-label={`Status: ${outcomeStatusLabels[status]}`}>
      {outcomeStatusLabels[status]}
    </Badge>
  );
}
