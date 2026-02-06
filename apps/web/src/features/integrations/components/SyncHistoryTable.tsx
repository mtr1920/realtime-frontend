/**
 * SyncHistoryTable Component
 * Displays sync history for a connector using the new BaseTable component.
 */

import { useMemo } from 'react';
import { XCircle, FileText } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import { SyncStatusBadge } from './SyncStatusBadge';
import { syncTriggerLabels, type SyncRecord } from '../types/integrations.types';

interface SyncHistoryTableProps {
  syncs: SyncRecord[];
  isLoading?: boolean;
  onCancel: (sync: SyncRecord) => void;
  onViewDetails: (sync: SyncRecord) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<SyncRecord>[] = [
  {
    id: 'scheduledAt',
    header: 'Scheduled',
    accessor: 'scheduledAt',
    cell: (row) => (
      <span className="text-sm">{formatDate(row.scheduledAt)}</span>
    ),
  },
  {
    id: 'trigger',
    header: 'Trigger',
    accessor: 'trigger',
    cell: (row) => (
      <Badge variant="secondary">
        {syncTriggerLabels[row.trigger]}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    cell: (row) => <SyncStatusBadge status={row.status} />,
  },
  {
    id: 'resource',
    header: 'Resource',
    accessor: (row) => `${row.resourceType}: ${row.resourceId}`,
    cell: (row) => (
      <span className="text-sm">
        {row.resourceType}: {row.resourceId.slice(0, 8)}...
      </span>
    ),
    hideOnMobile: true,
  },
  {
    id: 'attempt',
    header: 'Attempt',
    accessor: (row) => row.attempt,
    cell: (row) => (
      <span className="text-sm">
        {row.attempt} / {row.maxAttempts}
      </span>
    ),
    hideOnTablet: true,
  },
];

// ============================================================================
// Component
// ============================================================================

export function SyncHistoryTable({
  syncs,
  isLoading = false,
  onCancel,
  onViewDetails,
}: SyncHistoryTableProps) {
  const rowActions = useMemo<RowAction<SyncRecord>[]>(
    () => [
      {
        id: 'cancel',
        label: 'Cancel',
        icon: <XCircle className="h-4 w-4" />,
        variant: 'destructive',
        hidden: (row) => row.status !== 'pending' && row.status !== 'processing',
        onClick: onCancel,
      },
      {
        id: 'details',
        label: 'Details',
        icon: <FileText className="h-4 w-4" />,
        onClick: onViewDetails,
      },
    ],
    [onCancel, onViewDetails]
  );

  return (
    <BaseTable
      data={syncs}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No syncs found"
      emptyDescription="Syncs will appear here after they are triggered."
    />
  );
}
