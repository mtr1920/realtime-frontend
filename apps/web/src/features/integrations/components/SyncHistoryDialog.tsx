/**
 * SyncHistoryDialog Component
 * Dialog showing sync history for a connector.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { SyncHistoryTable } from './SyncHistoryTable';
import { SyncDetailDialog } from './SyncDetailDialog';
import { useSyncHistory } from '../hooks/useSyncHistory';
import { useCancelSync } from '../hooks/useCancelSync';
import { showSuccess, handleError } from '@/shared/errors';
import type { Connector, SyncRecord } from '../types/integrations.types';

interface SyncHistoryDialogProps {
  connector: Connector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncHistoryDialog({
  connector,
  open,
  onOpenChange,
}: SyncHistoryDialogProps) {
  const [selectedSync, setSelectedSync] = useState<SyncRecord | null>(null);
  const [page, setPage] = useState(1);

  const { syncs, pagination, isLoading, invalidate } = useSyncHistory(
    connector?.id ?? null,
    { page, limit: 10, orderBy: 'scheduledAt', orderDirection: 'desc' }
  );

  const { cancelSync, isLoading: isCancelling } = useCancelSync({
    onSuccess: () => {
      showSuccess('Sync cancelled');
      invalidate();
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to cancel sync' });
    },
  });

  const handleCancel = useCallback(
    async (sync: SyncRecord) => {
      if (!connector) return;
      await cancelSync({ connectorId: connector.id, syncId: sync.id });
    },
    [connector, cancelSync]
  );

  const handleViewDetails = useCallback((sync: SyncRecord) => {
    setSelectedSync(sync);
  }, []);

  if (!connector) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync History: {connector.name}</DialogTitle>
            <DialogDescription>
              View and manage sync operations for this connector.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SyncHistoryTable
              syncs={syncs}
              isLoading={isLoading || isCancelling}
              onCancel={handleCancel}
              onViewDetails={handleViewDetails}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SyncDetailDialog
        sync={selectedSync}
        open={!!selectedSync}
        onOpenChange={(open) => !open && setSelectedSync(null)}
      />
    </>
  );
}
