/**
 * SyncStatusBadge Component
 * Shows sync status.
 */

import { Badge } from '@/shared/ui';
import { syncStatusLabels, type SyncStatus } from '../types/integrations.types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const getVariant = (): 'default' | 'success' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getVariant()} aria-label={`Status: ${syncStatusLabels[status]}`}>
      {syncStatusLabels[status]}
    </Badge>
  );
}
