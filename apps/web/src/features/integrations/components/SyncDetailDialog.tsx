/**
 * SyncDetailDialog Component
 * Shows details of a sync record.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { Label } from '@/shared/ui';
import { SyncStatusBadge } from './SyncStatusBadge';
import { syncTriggerLabels, type SyncRecord } from '../types/integrations.types';

interface SyncDetailDialogProps {
  sync: SyncRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncDetailDialog({
  sync,
  open,
  onOpenChange,
}: SyncDetailDialogProps) {
  if (!sync) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return '-';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sync Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <SyncStatusBadge status={sync.status} />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Trigger</Label>
              <p className="text-sm font-medium mt-1">
                {syncTriggerLabels[sync.trigger]}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Direction</Label>
              <p className="text-sm font-medium mt-1 capitalize">
                {sync.direction}
              </p>
            </div>
          </div>

          {/* Resource */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Resource Type</Label>
              <p className="text-sm font-medium mt-1 capitalize">
                {sync.resourceType}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Resource ID</Label>
              <p className="text-sm font-mono mt-1 break-all">
                {sync.resourceId}
              </p>
            </div>
          </div>

          {/* Attempts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Attempt</Label>
              <p className="text-sm mt-1">
                {sync.attempt} of {sync.maxAttempts}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Connector</Label>
              <p className="text-sm font-mono mt-1">
                {sync.connectorId.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Scheduled</Label>
              <p className="text-sm mt-1">{formatDate(sync.scheduledAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Started</Label>
              <p className="text-sm mt-1">{formatDate(sync.startedAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Completed</Label>
              <p className="text-sm mt-1">{formatDate(sync.completedAt)}</p>
            </div>
          </div>

          {/* Error */}
          {sync.errorMessage && (
            <div>
              <Label className="text-muted-foreground">Error</Label>
              <div className="mt-1 rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{sync.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Response Data */}
          {sync.responseData && Object.keys(sync.responseData).length > 0 && (
            <div>
              <Label className="text-muted-foreground">Response Data</Label>
              <pre className="mt-1 rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
                {formatJson(sync.responseData)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
