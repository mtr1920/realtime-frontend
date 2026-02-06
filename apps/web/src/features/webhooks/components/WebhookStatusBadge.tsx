/**
 * WebhookStatusBadge Component
 * Displays webhook enabled/disabled status with appropriate styling.
 */

import { Badge } from '@/shared/ui';

interface WebhookStatusBadgeProps {
  enabled: boolean;
  failureCount?: number;
}

export function WebhookStatusBadge({ enabled, failureCount = 0 }: WebhookStatusBadgeProps) {
  if (!enabled) {
    return (
      <Badge variant="secondary" aria-label="Webhook disabled">
        Disabled
      </Badge>
    );
  }

  if (failureCount >= 5) {
    return (
      <Badge variant="destructive" aria-label="Webhook failing">
        Failing
      </Badge>
    );
  }

  if (failureCount > 0) {
    return (
      <Badge variant="warning" aria-label="Webhook has recent failures">
        Degraded
      </Badge>
    );
  }

  return (
    <Badge variant="success" aria-label="Webhook active">
      Active
    </Badge>
  );
}
