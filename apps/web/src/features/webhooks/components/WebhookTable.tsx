/**
 * WebhookTable Component
 * Displays a list of webhooks using the new BaseTable component.
 */

import { useState, useMemo } from 'react';
import { Pencil, Trash2, List, Power, ChevronDown, ChevronRight } from 'lucide-react';
import { BaseTable, Badge } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import { WebhookStatusBadge } from './WebhookStatusBadge';
import type { Webhook } from '../types/webhooks.types';
import { webhookEventLabels } from '../types/webhooks.types';

interface WebhookTableProps {
  webhooks: Webhook[];
  isLoading?: boolean;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhook: Webhook) => void;
  onViewDeliveries: (webhook: Webhook) => void;
  onToggleEnabled: (webhook: Webhook) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

// ============================================================================
// Expandable Name Cell
// ============================================================================

function NameCell({ webhook }: { webhook: Webhook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="text-left"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${webhook.name} details`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{webhook.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {webhook.url}
            </p>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="mt-3 ml-5 space-y-2 rounded-md bg-muted/30 p-3 text-sm">
          <p>
            <span className="font-medium">URL:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{webhook.url}</code>
          </p>
          <p>
            <span className="font-medium">Failure Count:</span> {webhook.failureCount}
          </p>
          <p>
            <span className="font-medium">Last Failed:</span> {formatDate(webhook.lastFailedAt)}
          </p>
          <p>
            <span className="font-medium">Created:</span> {formatDate(webhook.createdAt)}
          </p>
          <div>
            <span className="font-medium">Events:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {webhook.events.map((event) => (
                <Badge key={event} variant="secondary" className="text-xs">
                  {webhookEventLabels[event]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<Webhook>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    cell: (row) => <NameCell webhook={row} />,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => (row.enabled ? 'enabled' : 'disabled'),
    cell: (row) => (
      <WebhookStatusBadge
        enabled={row.enabled}
        failureCount={row.failureCount}
      />
    ),
  },
  {
    id: 'events',
    header: 'Events',
    accessor: (row) => row.events.length,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.events.length} event{row.events.length !== 1 ? 's' : ''}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    id: 'lastDeliveredAt',
    header: 'Last Delivered',
    accessor: 'lastDeliveredAt',
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.lastDeliveredAt)}
      </span>
    ),
    hideOnTablet: true,
  },
];

// ============================================================================
// Component
// ============================================================================

export function WebhookTable({
  webhooks,
  isLoading = false,
  onEdit,
  onDelete,
  onViewDeliveries,
  onToggleEnabled,
}: WebhookTableProps) {
  const rowActions = useMemo<RowAction<Webhook>[]>(
    () => [
      {
        id: 'deliveries',
        label: 'Deliveries',
        icon: <List className="h-4 w-4" />,
        onClick: onViewDeliveries,
      },
      {
        id: 'toggle',
        label: 'Toggle',
        icon: <Power className="h-4 w-4" />,
        onClick: onToggleEnabled,
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
    [onEdit, onDelete, onViewDeliveries, onToggleEnabled]
  );

  return (
    <BaseTable
      data={webhooks}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No webhooks found"
      emptyDescription="Create a webhook to start receiving event notifications."
    />
  );
}
