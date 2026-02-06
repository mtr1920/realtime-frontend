/**
 * ApiKeyTable Component
 * Displays a list of API keys using the new BaseTable component.
 */

import { useMemo } from 'react';
import { Pencil, XCircle } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import type { ApiKey } from '../types/api-keys.types';

interface ApiKeyTableProps {
  apiKeys: ApiKey[];
  isLoading?: boolean;
  onEdit: (apiKey: ApiKey) => void;
  onRevoke: (apiKey: ApiKey) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function isActive(apiKey: ApiKey): boolean {
  return !apiKey.revokedAt && !isExpired(apiKey.expiresAt);
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<ApiKey>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          Created {formatDate(row.createdAt)}
        </p>
      </div>
    ),
  },
  {
    id: 'keyPrefix',
    header: 'Key',
    accessor: 'keyPrefix',
    cell: (row) => (
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
        {row.keyPrefix}...
      </code>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => {
      if (row.revokedAt) return 'revoked';
      if (isExpired(row.expiresAt)) return 'expired';
      return 'active';
    },
    cell: (row) => {
      if (row.revokedAt) {
        return (
          <Badge variant="destructive" aria-label="API key revoked">
            Revoked
          </Badge>
        );
      }
      if (isExpired(row.expiresAt)) {
        return (
          <Badge variant="secondary" aria-label="API key expired">
            Expired
          </Badge>
        );
      }
      return (
        <Badge variant="success" aria-label="API key active">
          Active
        </Badge>
      );
    },
  },
  {
    id: 'scopes',
    header: 'Scopes',
    accessor: (row) => row.scopes.length,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.scopes.length} scope{row.scopes.length !== 1 ? 's' : ''}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    id: 'lastUsedAt',
    header: 'Last Used',
    accessor: 'lastUsedAt',
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.lastUsedAt)}
      </span>
    ),
    hideOnTablet: true,
  },
];

// ============================================================================
// Component
// ============================================================================

export function ApiKeyTable({
  apiKeys,
  isLoading = false,
  onEdit,
  onRevoke,
}: ApiKeyTableProps) {
  const rowActions = useMemo<RowAction<ApiKey>[]>(
    () => [
      {
        id: 'edit',
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        hidden: (row) => !isActive(row),
        onClick: onEdit,
      },
      {
        id: 'revoke',
        label: 'Revoke',
        icon: <XCircle className="h-4 w-4" />,
        variant: 'destructive',
        hidden: (row) => !isActive(row),
        onClick: onRevoke,
      },
    ],
    [onEdit, onRevoke]
  );

  return (
    <BaseTable
      data={apiKeys}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No API keys found"
      emptyDescription="Create an API key to start using the API."
    />
  );
}
