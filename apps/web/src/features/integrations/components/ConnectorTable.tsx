/**
 * ConnectorTable Component
 * Displays a table of integration connectors using the new BaseTable component.
 */

import { useMemo } from 'react';
import { Pencil, Trash2, RefreshCw, History } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import { ConnectorHealthBadge } from './ConnectorHealthBadge';
import { connectorTypeLabels, type Connector } from '../types/integrations.types';

interface ConnectorTableProps {
  connectors: Connector[];
  isLoading?: boolean;
  onEdit: (connector: Connector) => void;
  onViewSyncs: (connector: Connector) => void;
  onDelete: (connector: Connector) => void;
  onTriggerSync: (connector: Connector) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<Connector>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        {row.description && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.description}
          </p>
        )}
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    accessor: 'type',
    cell: (row) => (
      <Badge variant="secondary">
        {connectorTypeLabels[row.type]}
      </Badge>
    ),
  },
  {
    id: 'health',
    header: 'Health',
    accessor: (row) => row.enabled ? 'enabled' : 'disabled',
    cell: (row) => <ConnectorHealthBadge connector={row} />,
  },
  {
    id: 'lastSyncAt',
    header: 'Last Sync',
    accessor: 'lastSyncAt',
    cell: (row) => (
      <div>
        <p className="text-sm">{formatDate(row.lastSyncAt)}</p>
        {row.lastError && (
          <p className="text-xs text-destructive truncate max-w-[200px]">
            {row.lastError}
          </p>
        )}
      </div>
    ),
    hideOnMobile: true,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ConnectorTable({
  connectors,
  isLoading = false,
  onEdit,
  onViewSyncs,
  onDelete,
  onTriggerSync,
}: ConnectorTableProps) {
  const rowActions = useMemo<RowAction<Connector>[]>(
    () => [
      {
        id: 'sync',
        label: 'Sync',
        icon: <RefreshCw className="h-4 w-4" />,
        hidden: (row) => !row.enabled,
        onClick: onTriggerSync,
      },
      {
        id: 'history',
        label: 'History',
        icon: <History className="h-4 w-4" />,
        onClick: onViewSyncs,
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: onEdit,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: onDelete,
      },
    ],
    [onEdit, onDelete, onViewSyncs, onTriggerSync]
  );

  return (
    <BaseTable
      data={connectors}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No connectors found"
      emptyDescription="Create a connector to start integrating with external systems."
    />
  );
}
