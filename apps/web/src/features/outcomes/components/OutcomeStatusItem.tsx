/**
 * OutcomeStatusItem
 *
 * Individual outcome item with status and progress.
 * Used for displaying real-time outcome generation status.
 */

import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileText,
  MessageSquare,
  BarChart,
  FileCheck,
} from 'lucide-react';
import { Progress } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

/**
 * Real-time outcome generation status.
 * Different from OutcomeStatus in outcomes.types.ts which is for final outcome status.
 */
export interface OutcomeGenerationStatus {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  updatedAt: string;
}

// =============================================================================
// Component
// =============================================================================

export interface OutcomeStatusItemProps {
  outcome: OutcomeGenerationStatus;
  className?: string;
}

export function OutcomeStatusItem({ outcome, className }: OutcomeStatusItemProps) {
  const { type, status, progress, error } = outcome;

  const Icon = getOutcomeIcon(type);
  const StatusIcon = getStatusIcon(status);
  const statusColor = getStatusColor(status);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        status === 'completed' && 'border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/50',
        status === 'failed' && 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/50',
        status === 'processing' && 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/50',
        className
      )}
    >
      {/* Type Icon */}
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
          'bg-muted'
        )}
      >
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium capitalize">
            {formatOutcomeType(type)}
          </span>
          <div className={cn('flex items-center gap-1', statusColor)}>
            <StatusIcon
              className={cn(
                'h-4 w-4',
                status === 'processing' && 'motion-safe:animate-spin'
              )}
              aria-hidden
            />
            <span className="text-xs capitalize">{status}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {status === 'processing' && progress !== undefined && (
          <Progress value={progress} className="h-1.5" />
        )}

        {/* Error Message */}
        {status === 'failed' && error && (
          <p className="text-xs text-destructive truncate" title={error}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getOutcomeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'transcript':
      return MessageSquare;
    case 'summary':
    case 'report':
      return FileText;
    case 'scorecard':
    case 'evaluation':
      return BarChart;
    case 'compliance':
      return FileCheck;
    default:
      return FileText;
  }
}

function getStatusIcon(status: OutcomeGenerationStatus['status']) {
  switch (status) {
    case 'completed':
      return CheckCircle2;
    case 'failed':
      return XCircle;
    case 'processing':
      return Loader2;
    case 'pending':
    default:
      return Clock;
  }
}

function getStatusColor(status: OutcomeGenerationStatus['status']): string {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400';
    case 'failed':
      return 'text-red-600 dark:text-red-400';
    case 'processing':
      return 'text-blue-600 dark:text-blue-400';
    case 'pending':
    default:
      return 'text-muted-foreground';
  }
}

function formatOutcomeType(type: string): string {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
