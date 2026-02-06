/**
 * Session Status Timeline
 * Visual timeline showing session status progression.
 */

import {
  CircleDot,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import type { SessionStatus } from '../../api/sessions.service';
import { cn } from '@/shared/lib/utils';

interface SessionStatusTimelineProps {
  status: SessionStatus;
}

interface StatusStep {
  status: SessionStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_STEPS: StatusStep[] = [
  { status: 'CREATED', label: 'Created', icon: CircleDot },
  { status: 'WAITING', label: 'Waiting', icon: Clock },
  { status: 'ACTIVE', label: 'Active', icon: Play },
  { status: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
];

// Additional terminal statuses (displayed separately)
const TERMINAL_STATUSES: Record<SessionStatus, StatusStep | null> = {
  CREATED: null,
  WAITING: null,
  ACTIVE: null,
  PAUSED: { status: 'PAUSED', label: 'Paused', icon: Pause },
  COMPLETED: null,
  EXPIRED: { status: 'EXPIRED', label: 'Expired', icon: AlertCircle },
  FAILED: { status: 'FAILED', label: 'Failed', icon: XCircle },
};

const STATUS_ORDER: Record<SessionStatus, number> = {
  CREATED: 0,
  WAITING: 1,
  ACTIVE: 2,
  PAUSED: 2, // Same as active
  COMPLETED: 3,
  EXPIRED: 3, // Terminal
  FAILED: 3, // Terminal
};

export function SessionStatusTimeline({ status }: SessionStatusTimelineProps) {
  const currentIndex = STATUS_ORDER[status];
  const terminalStatus = TERMINAL_STATUSES[status];
  const isTerminal = status === 'EXPIRED' || status === 'FAILED';

  // For terminal statuses that aren't COMPLETED, show the alternative ending
  const displaySteps = isTerminal
    ? [
        ...STATUS_STEPS.slice(0, 3),
        terminalStatus!,
      ]
    : STATUS_STEPS;

  return (
    <div className="flex items-center gap-0">
      {displaySteps.map((step, index) => {
        const Icon = step.icon;
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === displaySteps.length - 1;

        // Determine the state
        let state: 'completed' | 'current' | 'upcoming' = 'upcoming';
        if (isPast) state = 'completed';
        if (isCurrent) state = 'current';

        // Special styling for terminal error states
        const isError = step.status === 'EXPIRED' || step.status === 'FAILED';

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                  state === 'completed' && 'bg-primary border-primary text-primary-foreground',
                  state === 'current' && !isError && 'bg-primary/20 border-primary text-primary',
                  state === 'current' && isError && 'bg-destructive/20 border-destructive text-destructive',
                  state === 'upcoming' && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs font-medium',
                  state === 'completed' && 'text-primary',
                  state === 'current' && !isError && 'text-primary',
                  state === 'current' && isError && 'text-destructive',
                  state === 'upcoming' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-1',
                  isPast || (isCurrent && index < displaySteps.length - 1)
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
