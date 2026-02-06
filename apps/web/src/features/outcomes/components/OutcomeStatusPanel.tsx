/**
 * OutcomeStatusPanel
 *
 * Panel displaying session outcomes and their status.
 * Fetches outcome data via TanStack Query.
 */

import { useMemo } from 'react';
import { FileOutput, Info, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionPermissions } from '@/features/sessions/hooks/useSessionPermissions';
import { useSessionOutcome } from '../hooks/useSessionOutcome';
import { OutcomeStatusBadge } from './OutcomeStatusBadge';
import type { SessionStatus } from '@/types';

export interface OutcomeStatusPanelProps {
  /** Session ID */
  sessionId: string;

  /** Session status (for conditional fetching) */
  sessionStatus?: SessionStatus;

  /** Maximum height */
  maxHeight?: string;

  /** Whether to show even when empty */
  showEmpty?: boolean;

  /** Additional CSS class */
  className?: string;
}

export function OutcomeStatusPanel({
  sessionId,
  sessionStatus,
  maxHeight = '400px',
  showEmpty = false,
  className,
}: OutcomeStatusPanelProps) {
  const { canViewOutcome } = useSessionPermissions();

  // Only fetch when session is completed and user has permission
  const shouldFetch = canViewOutcome && sessionStatus === 'COMPLETED';
  const { outcome, isLoading, isError } = useSessionOutcome(shouldFetch ? sessionId : null);

  // Calculate sections - must be called before any early returns
  const sections = useMemo(() => {
    if (!outcome) return [];
    const result: Array<{ label: string; available: boolean }> = [];
    if (outcome.summary) result.push({ label: 'Summary', available: true });
    if (outcome.evaluation) result.push({ label: 'Evaluation', available: true });
    if (outcome.decision) result.push({ label: 'Decision', available: true });
    if (outcome.integrity) result.push({ label: 'Integrity', available: true });
    return result;
  }, [outcome]);

  // Don't render if user can't view outcomes
  if (!canViewOutcome) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileOutput className="h-4 w-4" aria-hidden />
            Session Outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 motion-safe:animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state or no outcome
  if (isError || !outcome) {
    if (!showEmpty) {
      return null;
    }
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileOutput className="h-4 w-4" aria-hidden />
            Session Outcome
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileOutput className="h-4 w-4" aria-hidden />
            Session Outcome
          </CardTitle>
          <OutcomeStatusBadge status={outcome.status} />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3">
            {/* Outcome Sections */}
            {sections.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Available sections:</p>
                <div className="flex flex-wrap gap-2">
                  {sections.map((section) => (
                    <span
                      key={section.label}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs"
                    >
                      {section.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Outcome is {outcome.status}. Details will be available once processing completes.
              </p>
            )}

            {/* Timestamps */}
            {outcome.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Generated: {new Date(outcome.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <Info className="h-8 w-8 text-muted-foreground mb-2" aria-hidden />
      <p className="text-sm font-medium">No Outcome Available</p>
      <p className="text-xs text-muted-foreground">
        The outcome will be available once the session is completed.
      </p>
    </div>
  );
}
