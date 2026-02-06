---
name: status-badge-patterns
description: Use when implementing status badges, status indicators, or status-to-styling mappings
---

# Status Badge Patterns

CVA badge variants, status-to-icon mapping, and semantic color usage.

## Overview

This skill covers status badge components, configuration-based status mapping, and consistent status representation across the UI.

---

## Status Config Pattern

```typescript
// ✅ CORRECT - Config object for status mapping
// features/sessions/components/shared/SessionStatusBadge.tsx

import { Badge } from '@realtime/ui';
import { Clock, Play, Pause, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { SessionStatus } from '@/types';

interface StatusConfig {
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';
  icon: ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  CREATED: {
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    label: 'Scheduled',
  },
  ACTIVE: {
    variant: 'success',
    icon: <Play className="h-3 w-3" />,
    label: 'Active',
  },
  PAUSED: {
    variant: 'warning',
    icon: <Pause className="h-3 w-3" />,
    label: 'Paused',
  },
  COMPLETED: {
    variant: 'info',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Completed',
  },
  CANCELLED: {
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled',
  },
  FAILED: {
    variant: 'destructive',
    icon: <AlertTriangle className="h-3 w-3" />,
    label: 'Failed',
  },
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
  showIcon?: boolean;
  className?: string;
}

export function SessionStatusBadge({
  status,
  showIcon = true,
  className,
}: SessionStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
```

---

## User Status Badge

```typescript
// ✅ CORRECT - User status with config
// features/users/components/UserStatusBadge.tsx

type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';

const USER_STATUS_CONFIG: Record<UserStatus, StatusConfig> = {
  ACTIVE: {
    variant: 'success',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Active',
  },
  INVITED: {
    variant: 'info',
    icon: <Mail className="h-3 w-3" />,
    label: 'Invited',
  },
  SUSPENDED: {
    variant: 'warning',
    icon: <Ban className="h-3 w-3" />,
    label: 'Suspended',
  },
  DELETED: {
    variant: 'destructive',
    icon: <Trash2 className="h-3 w-3" />,
    label: 'Deleted',
  },
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = USER_STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
```

---

## Webhook Delivery Status

```typescript
// ✅ CORRECT - Delivery status with detailed config
type DeliveryStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';

const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, StatusConfig & { description: string }> = {
  PENDING: {
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending',
    description: 'Waiting to be sent',
  },
  SUCCESS: {
    variant: 'success',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Delivered',
    description: 'Successfully delivered',
  },
  FAILED: {
    variant: 'destructive',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Failed',
    description: 'Delivery failed after retries',
  },
  RETRYING: {
    variant: 'warning',
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    label: 'Retrying',
    description: 'Retrying delivery',
  },
};

export function DeliveryStatusBadge({
  status,
  showTooltip = false,
}: {
  status: DeliveryStatus;
  showTooltip?: boolean;
}) {
  const config = DELIVERY_STATUS_CONFIG[status];

  const badge = (
    <Badge variant={config.variant}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{config.description}</TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
```

---

## Connector Health Status

```typescript
// ✅ CORRECT - Health status with color indicator
type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

const HEALTH_CONFIG: Record<HealthStatus, { color: string; label: string }> = {
  HEALTHY: { color: 'bg-success', label: 'Healthy' },
  DEGRADED: { color: 'bg-warning', label: 'Degraded' },
  UNHEALTHY: { color: 'bg-destructive', label: 'Unhealthy' },
  UNKNOWN: { color: 'bg-muted', label: 'Unknown' },
};

export function ConnectorHealthBadge({ status }: { status: HealthStatus }) {
  const config = HEALTH_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', config.color)} />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
```

---

## Online/Offline Indicator

```typescript
// ✅ CORRECT - Simple presence indicator
interface PresenceIndicatorProps {
  isOnline: boolean;
  showLabel?: boolean;
}

export function PresenceIndicator({ isOnline, showLabel = false }: PresenceIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isOnline ? 'bg-success' : 'bg-muted-foreground'
        )}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}
```

---

## Badge Variants (CVA)

```typescript
// ✅ CORRECT - Badge CVA definition
// packages/ui/src/components/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Semantic status variants
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

---

## Semantic Color Classes

```css
/* ✅ CORRECT - Use semantic colors in CSS variables */
/* index.css or tailwind config */
:root {
  --success: 142.1 76.2% 36.3%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
  --info: 199 89% 48%;
  --info-foreground: 0 0% 100%;
}

.dark {
  --success: 142.1 70.6% 45.3%;
  --warning: 38 92% 50%;
  --info: 199 89% 48%;
}
```

```typescript
// ✅ CORRECT - Use semantic classes
<Badge variant="success">Active</Badge>
<Badge variant="warning">Paused</Badge>
<Badge variant="destructive">Failed</Badge>

// ❌ WRONG - Raw Tailwind colors
<span className="bg-emerald-100 text-emerald-700">Active</span>
<span className="bg-amber-100 text-amber-700">Paused</span>
```

---

## Animated States

```typescript
// ✅ CORRECT - Animated status indicators
const SYNC_STATUS_CONFIG = {
  SYNCING: {
    variant: 'info',
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    label: 'Syncing',
  },
  QUEUED: {
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    label: 'Queued',
  },
  // ...
};

// Pulsing dot for live status
function LiveIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
    </span>
  );
}
```

---

## Status with Count

```typescript
// ✅ CORRECT - Badge with count
function StatusSummary({ sessions }: { sessions: Session[] }) {
  const counts = useMemo(() => {
    return sessions.reduce(
      (acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1;
        return acc;
      },
      {} as Record<SessionStatus, number>
    );
  }, [sessions]);

  return (
    <div className="flex gap-2">
      {Object.entries(counts).map(([status, count]) => (
        <Badge
          key={status}
          variant={STATUS_CONFIG[status as SessionStatus].variant}
        >
          {count} {STATUS_CONFIG[status as SessionStatus].label}
        </Badge>
      ))}
    </div>
  );
}
```

---

## Status Filter Chips

```typescript
// ✅ CORRECT - Clickable status filters
function StatusFilters({
  value,
  onChange,
}: {
  value: SessionStatus[];
  onChange: (statuses: SessionStatus[]) => void;
}) {
  const toggleStatus = (status: SessionStatus) => {
    if (value.includes(status)) {
      onChange(value.filter((s) => s !== status));
    } else {
      onChange([...value, status]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(STATUS_CONFIG).map(([status, config]) => (
        <Badge
          key={status}
          variant={value.includes(status as SessionStatus) ? config.variant : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleStatus(status as SessionStatus)}
        >
          {config.icon}
          <span>{config.label}</span>
        </Badge>
      ))}
    </div>
  );
}
```

---

## Critical Rules

1. **Config object pattern** - never switch statements in render
2. **Semantic variants** - success, warning, destructive, info
3. **Never raw Tailwind colors** - use semantic color classes
4. **Include icon and label** - for visual consistency
5. **Export config** - for reuse in filters and summaries
6. **Handle unknown status** - fallback to secondary variant
7. **Tooltip for details** - optional extended description
8. **Animate active states** - spinning for loading, pulsing for live

---

## Related Skills

- `ui-component-patterns` - CVA and theming
- `datatable-patterns` - Status in tables
- `domain-config-patterns` - Config-driven UI
