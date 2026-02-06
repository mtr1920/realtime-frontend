/**
 * ExportDialog Component
 * Dialog for exporting audit logs.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { useExportAuditLogs } from '../hooks/useExportAuditLogs';
import { showSuccess, handleError } from '@/shared/errors';
import type { ExportFormat, AuditLogListParams } from '../types/audit-logs.types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: AuditLogListParams;
}

export function ExportDialog({
  open,
  onOpenChange,
  filters,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');

  const { exportLogs, isLoading } = useExportAuditLogs({
    onSuccess: () => {
      showSuccess('Audit logs exported successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to export audit logs' });
    },
  });

  const handleExport = () => {
    exportLogs(format, filters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Audit Logs</DialogTitle>
          <DialogDescription>
            Choose a format to export the filtered audit logs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  format === 'json'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                aria-pressed={format === 'json'}
              >
                <p className="font-medium">JSON</p>
                <p className="text-xs text-muted-foreground">
                  Structured data format
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  format === 'csv'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                aria-pressed={format === 'csv'}
              >
                <p className="font-medium">CSV</p>
                <p className="text-xs text-muted-foreground">
                  Spreadsheet compatible
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
