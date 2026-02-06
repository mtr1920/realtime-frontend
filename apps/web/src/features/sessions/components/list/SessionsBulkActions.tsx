/**
 * Sessions Bulk Actions
 * Floating action bar for bulk operations on selected sessions.
 */

import { useMemo } from 'react';
import { Square, XCircle, Download, X } from 'lucide-react';
import type { Session } from '../../api/sessions.service';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface SessionsBulkActionsProps {
  sessions: Session[];
  selectedIds: Set<string>;
  isProcessing?: boolean;
  onClearSelection: () => void;
  onBulkComplete: (sessions: Session[]) => void;
  onBulkCancel: (sessions: Session[]) => void;
  onExportCsv: (sessions: Session[]) => void;
}

export function SessionsBulkActions({
  sessions,
  selectedIds,
  isProcessing = false,
  onClearSelection,
  onBulkComplete,
  onBulkCancel,
  onExportCsv,
}: SessionsBulkActionsProps) {
  const selectedSessions = useMemo(() => {
    return sessions.filter((s) => selectedIds.has(s.id));
  }, [sessions, selectedIds]);

  const counts = useMemo(() => {
    const result = {
      completable: 0,
      cancelable: 0,
    };

    for (const session of selectedSessions) {
      if (session.status === 'ACTIVE' || session.status === 'PAUSED') {
        result.completable++;
      }
      if (session.status === 'CREATED' || session.status === 'WAITING') {
        result.cancelable++;
      }
    }

    return result;
  }, [selectedSessions]);

  if (selectedIds.size === 0) {
    return null;
  }

  const completableSessions = selectedSessions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  );
  const cancelableSessions = selectedSessions.filter(
    (s) => s.status === 'CREATED' || s.status === 'WAITING'
  );

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
        'bg-background border border-border',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4'
      )}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2 pr-3 border-r border-border">
        <span className="text-sm font-medium">
          {selectedIds.size} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      {/* Bulk Complete */}
      {counts.completable > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkComplete(completableSessions)}
          disabled={isProcessing}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <Square className="mr-2 h-4 w-4" />
          End {counts.completable}
        </Button>
      )}

      {/* Bulk Cancel */}
      {counts.cancelable > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkCancel(cancelableSessions)}
          disabled={isProcessing}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel {counts.cancelable}
        </Button>
      )}

      {/* Export CSV */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExportCsv(selectedSessions)}
        disabled={isProcessing}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
