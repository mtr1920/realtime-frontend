/**
 * OutcomeDetailDialog Component
 * Dialog showing full outcome details.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import { OutcomeStatusBadge } from './OutcomeStatusBadge';
import { OutcomeSummary } from './OutcomeSummary';
import { OutcomeEvaluation } from './OutcomeEvaluation';
import { OutcomeDecision } from './OutcomeDecision';
import { OutcomeIntegrity } from './OutcomeIntegrity';
import { OutcomeArtifactsPanel } from './OutcomeArtifactsPanel';
import { RejectOutcomeDialog } from './RejectOutcomeDialog';
import { useOutcomeArtifacts } from '../hooks/useOutcomeArtifacts';
import { useApproveOutcome } from '../hooks/useApproveOutcome';
import { useRejectOutcome } from '../hooks/useRejectOutcome';
import { useRegenerateOutcome } from '../hooks/useRegenerateOutcome';
import { showSuccess, handleError } from '@/shared/errors';
import type { Outcome } from '../types/outcomes.types';

interface OutcomeDetailDialogProps {
  outcome: Outcome | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

export function OutcomeDetailDialog({
  outcome,
  open,
  onOpenChange,
  onActionComplete,
}: OutcomeDetailDialogProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Fetch artifacts
  const { artifacts, isLoading: isLoadingArtifacts } = useOutcomeArtifacts(
    outcome?.id ?? null
  );

  // Actions
  const { approveOutcome, isLoading: isApproving } = useApproveOutcome({
    onSuccess: () => {
      showSuccess('Outcome approved successfully');
      onActionComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to approve outcome' });
    },
  });

  const { rejectOutcome, isLoading: isRejecting } = useRejectOutcome({
    onSuccess: () => {
      showSuccess('Outcome rejected');
      setIsRejectDialogOpen(false);
      onActionComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to reject outcome' });
    },
  });

  const { regenerateOutcome, isLoading: isRegenerating } = useRegenerateOutcome({
    onSuccess: () => {
      showSuccess('Outcome regeneration started');
      onActionComplete?.();
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to regenerate outcome' });
    },
  });

  const handleApprove = useCallback(async () => {
    if (!outcome) return;
    await approveOutcome(outcome.sessionId);
  }, [outcome, approveOutcome]);

  const handleReject = useCallback(
    async (note: string) => {
      if (!outcome) return;
      await rejectOutcome({ sessionId: outcome.sessionId, input: { note } });
    },
    [outcome, rejectOutcome]
  );

  const handleRegenerate = useCallback(async () => {
    if (!outcome) return;
    await regenerateOutcome(outcome.sessionId);
  }, [outcome, regenerateOutcome]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const isActionable = outcome?.status === 'ready';
  const isActioning = isApproving || isRejecting || isRegenerating;

  if (!outcome) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {outcome.sessionTitle || `Outcome for Session`}
              </DialogTitle>
              <OutcomeStatusBadge status={outcome.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {outcome.workspaceName && `${outcome.workspaceName} • `}
              Created {formatDate(outcome.createdAt)}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Approval/Rejection Info */}
            {outcome.status === 'approved' && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Approved on {formatDate(outcome.approvedAt)}
                  {outcome.approvedBy && ` by ${outcome.approvedBy}`}
                </p>
              </div>
            )}

            {outcome.status === 'rejected' && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                  Rejected on {formatDate(outcome.rejectedAt)}
                  {outcome.rejectedBy && ` by ${outcome.rejectedBy}`}
                </p>
                {outcome.rejectionNote && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Reason: {outcome.rejectionNote}
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            {outcome.summary && <OutcomeSummary summary={outcome.summary} />}

            {/* Evaluation & Decision */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {outcome.evaluation && (
                <OutcomeEvaluation evaluation={outcome.evaluation} />
              )}
              {outcome.decision && (
                <OutcomeDecision decision={outcome.decision} />
              )}
            </div>

            {/* Integrity */}
            {outcome.integrity && (
              <OutcomeIntegrity integrity={outcome.integrity} />
            )}

            {/* Artifacts */}
            <OutcomeArtifactsPanel
              artifacts={artifacts}
              isLoading={isLoadingArtifacts}
            />

            {/* Actions - Only visible to users with canManageOutcomes permission */}
            <PermissionGate permission="canManageOutcomes">
              {isActionable && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={isActioning}
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsRejectDialogOpen(true)}
                    disabled={isActioning}
                  >
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={isActioning}>
                    {isApproving ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              )}
            </PermissionGate>
          </div>
        </DialogContent>
      </Dialog>

      <RejectOutcomeDialog
        outcome={outcome}
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleReject}
        isLoading={isRejecting}
      />
    </>
  );
}
