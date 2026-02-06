/**
 * Domain Config Table
 * Displays domain configurations using the new BaseTable component.
 */

import { useMemo, useCallback } from 'react';
import { Pencil, Trash2, Copy, Star, Check, X } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import type { DomainConfig } from '../types/domain-configs.types';
import { domainTypeLabels } from '../types/domain-configs.types';

interface DomainConfigTableProps {
  configs: DomainConfig[];
  isLoading?: boolean;
  onEdit?: (config: DomainConfig) => void;
  onDelete?: (config: DomainConfig) => void;
  onDuplicate?: (config: DomainConfig) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<DomainConfig>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.name}</span>
        {row.isDefault && (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        )}
      </div>
    ),
  },
  {
    id: 'domainType',
    header: 'Domain Type',
    accessor: 'domainType',
    cell: (row) => (
      <Badge variant="outline">
        {domainTypeLabels[row.domainType] || row.domainType}
      </Badge>
    ),
  },
  {
    id: 'version',
    header: 'Version',
    accessor: 'version',
    cell: (row) => (
      <span className="text-muted-foreground">v{row.version}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => (row.isActive ? 'active' : 'inactive'),
    cell: (row) =>
      row.isActive ? (
        <Badge variant="outline" className="border-green-500 text-green-600">
          <Check className="mr-1 h-3 w-3" />
          Active
        </Badge>
      ) : (
        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
          <X className="mr-1 h-3 w-3" />
          Inactive
        </Badge>
      ),
  },
  {
    id: 'updatedAt',
    header: 'Updated',
    accessor: 'updatedAt',
    cell: (row) => (
      <span className="text-muted-foreground">
        {formatDate(row.updatedAt)}
      </span>
    ),
  },
];

// ============================================================================
// Component
// ============================================================================

export function DomainConfigTable({
  configs,
  isLoading = false,
  onEdit,
  onDelete,
  onDuplicate,
  canEdit = true,
  canDelete = true,
}: DomainConfigTableProps) {
  const rowActions = useMemo<RowAction<DomainConfig>[]>(() => {
    const actions: RowAction<DomainConfig>[] = [];

    if (canEdit && onEdit) {
      actions.push({
        id: 'edit',
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: onEdit,
      });
    }

    if (onDuplicate) {
      actions.push({
        id: 'duplicate',
        label: 'Duplicate',
        icon: <Copy className="h-4 w-4" />,
        onClick: onDuplicate,
      });
    }

    if (canDelete && onDelete) {
      actions.push({
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: onDelete,
      });
    }

    return actions;
  }, [canEdit, canDelete, onEdit, onDelete, onDuplicate]);

  const handleRowClick = useCallback(
    (row: DomainConfig) => {
      onEdit?.(row);
    },
    [onEdit]
  );

  return (
    <BaseTable
      data={configs}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      onRowClick={onEdit ? handleRowClick : undefined}
      emptyTitle="No configurations found"
      emptyDescription="Create a domain configuration to customize session behavior."
    />
  );
}
