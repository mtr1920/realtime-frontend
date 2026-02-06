/**
 * AuditLogTable Component
 * Displays a table of audit log entries using the new BaseTable component.
 */

import { useMemo } from 'react';
import { Eye } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import {
  auditActionLabels,
  auditResourceLabels,
  auditActorTypeLabels,
  type AuditLog,
} from '../types/audit-logs.types';

interface AuditLogTableProps {
  auditLogs: AuditLog[];
  isLoading?: boolean;
  onViewDetails: (log: AuditLog) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function getActionVariant(action: string): 'default' | 'success' | 'destructive' | 'secondary' {
  if (action.includes('delete') || action.includes('revoke') || action.includes('remove')) {
    return 'destructive';
  }
  if (action.includes('create') || action === 'login') {
    return 'success';
  }
  if (action.includes('update') || action.includes('change')) {
    return 'default';
  }
  return 'secondary';
}

function getActorDisplay(log: AuditLog): string {
  if (log.actor.email) return log.actor.email;
  if (log.actor.name) return log.actor.name;
  return `${auditActorTypeLabels[log.actor.type]}: ${log.actor.id.slice(0, 8)}...`;
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<AuditLog>[] = [
  {
    id: 'createdAt',
    header: 'Timestamp',
    accessor: 'createdAt',
    cell: (row) => (
      <span className="text-sm">{formatDate(row.createdAt)}</span>
    ),
  },
  {
    id: 'actor',
    header: 'Actor',
    accessor: (row) => row.actor.email || row.actor.name || row.actor.id,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{getActorDisplay(row)}</p>
        <p className="text-xs text-muted-foreground">
          {auditActorTypeLabels[row.actor.type]}
        </p>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Action',
    accessor: 'action',
    cell: (row) => (
      <Badge
        variant={getActionVariant(row.action)}
        aria-label={`Action: ${row.action}`}
      >
        {auditActionLabels[row.action] || row.action}
      </Badge>
    ),
  },
  {
    id: 'resource',
    header: 'Resource',
    accessor: 'resource',
    cell: (row) => (
      <div>
        <p className="text-sm">
          {auditResourceLabels[row.resource] || row.resource}
        </p>
        {row.resourceName && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.resourceName}
          </p>
        )}
      </div>
    ),
    hideOnMobile: true,
  },
  {
    id: 'ip',
    header: 'IP Address',
    accessor: (row) => row.actor.ip || '-',
    cell: (row) => (
      <span className="text-sm text-muted-foreground font-mono">
        {row.actor.ip || '-'}
      </span>
    ),
    hideOnTablet: true,
  },
];

// ============================================================================
// Component
// ============================================================================

export function AuditLogTable({
  auditLogs,
  isLoading = false,
  onViewDetails,
}: AuditLogTableProps) {
  const rowActions = useMemo<RowAction<AuditLog>[]>(
    () => [
      {
        id: 'view',
        label: 'View',
        icon: <Eye className="h-4 w-4" />,
        onClick: onViewDetails,
      },
    ],
    [onViewDetails]
  );

  return (
    <BaseTable
      data={auditLogs}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No audit logs found"
      emptyDescription="Adjust your filters or check back later."
    />
  );
}
