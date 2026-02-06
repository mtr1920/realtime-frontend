---
title: "6. Component Architecture"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 6. Component Architecture

### 4.1 Component Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Primitives | Unstyled, accessible base | Button, Input, Dialog |
| UI Components | Styled, reusable | Card, Badge, Avatar |
| Feature Components | Domain-specific | VideoTile, TranscriptEntry |
| Layout Components | Page structure | Sidebar, Header, PageLayout |
| Composite Components | Feature combinations | SessionRoom, AdminDashboard |

### 4.2 Component Patterns

```typescript
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

### 4.3 Feature Component Pattern

```typescript
// features/session/components/ParticipantList.tsx
import { useSessionStore } from '../stores/session.store';
import { useSessionConfig } from '../hooks/useSessionConfig';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ParticipantListProps {
  className?: string;
  showRoles?: boolean;
  onParticipantClick?: (id: string) => void;
}

export function ParticipantList({
  className,
  showRoles = true,
  onParticipantClick,
}: ParticipantListProps) {
  const participants = useSessionStore((state) =>
    Array.from(state.participants.values())
  );
  const myId = useSessionStore((state) => state.myParticipantId);
  const { getRoleDefinition, canRemoveParticipant } = useSessionConfig();

  return (
    <div className={cn('space-y-2', className)}>
      {participants.map((participant) => {
        const role = getRoleDefinition(participant.roleId);
        const isMe = participant.id === myId;

        return (
          <div
            key={participant.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              'hover:bg-accent cursor-pointer',
              isMe && 'bg-accent/50'
            )}
            onClick={() => onParticipantClick?.(participant.id)}
          >
            <Avatar
              src={participant.avatarUrl}
              fallback={participant.displayName}
              status={participant.status}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {participant.displayName}
                {isMe && ' (You)'}
              </p>
              {showRoles && role && (
                <p className="text-xs text-muted-foreground">
                  {role.name}
                </p>
              )}
            </div>
            {participant.status === 'ACTIVE' && (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 4.4 Observer + AI Actor Components

These components are domain-agnostic and must render based on config, not hardcoded interview roles. Interview is one profile among many.

Key role-aware components that must be configuration-driven:

| Component | Purpose |
|----------|---------|
| AIActorAvatar | Renders AI persona avatar + speaking state |
| AIActorCard | Shows active actor role, voice, and status |
| ObserverJoinPanel | Read-only observer join entry point |
| RecordingMixStatus | Indicates AI audio mixed into recording |

```typescript
// features/ai/avatar/AIActorAvatar.tsx
import { useSessionConfig } from '@/features/session/hooks/useSessionConfig';

export function AIActorAvatar() {
  const { config } = useSessionConfig();
  const actor = config?.modules.ai?.activeActor;

  if (!actor) return null;

  return (
    <div className="flex items-center gap-3">
      <img src={actor.avatarUrl} alt={actor.displayName} className="h-10 w-10 rounded-full" />
      <div className="text-sm">
        <div className="font-medium">{actor.displayName}</div>
        <div className="text-muted-foreground">{actor.roleLabel}</div>
      </div>
    </div>
  );
}
```

---
