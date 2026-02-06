/**
 * DeliveryStatusBadge Component
 * Displays webhook delivery status with appropriate styling.
 */

import { Badge } from '@/shared/ui';
import type { DeliveryStatus } from '../types/webhooks.types';
import { deliveryStatusLabels } from '../types/webhooks.types';

interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
}

const statusVariants: Record<DeliveryStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  DELIVERED: 'success',
  FAILED: 'warning',
  EXHAUSTED: 'destructive',
};

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      aria-label={`Delivery status: ${deliveryStatusLabels[status]}`}
    >
      {deliveryStatusLabels[status]}
    </Badge>
  );
}
