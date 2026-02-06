/**
 * ConnectorHealthBadge Component
 * Shows connector health status.
 */

import { Badge } from '@/shared/ui';
import type { Connector } from '../types/integrations.types';

interface ConnectorHealthBadgeProps {
  connector: Connector;
}

export function ConnectorHealthBadge({ connector }: ConnectorHealthBadgeProps) {
  if (!connector.enabled) {
    return (
      <Badge variant="secondary" aria-label="Connector disabled">
        Disabled
      </Badge>
    );
  }

  if (connector.failureCount >= 5) {
    return (
      <Badge variant="destructive" aria-label="Connector unhealthy">
        Unhealthy
      </Badge>
    );
  }

  if (connector.failureCount > 0) {
    return (
      <Badge variant="default" aria-label="Connector degraded">
        Degraded
      </Badge>
    );
  }

  return (
    <Badge variant="success" aria-label="Connector healthy">
      Healthy
    </Badge>
  );
}
