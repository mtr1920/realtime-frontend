/**
 * DeliveryLogTable Component
 * Displays webhook delivery history using the new BaseTable component.
 */

import { useState, useMemo } from 'react';
import { RefreshCw, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { BaseTable } from '@/shared/ui';
import type { TableColumn, RowAction } from '@realtime/ui';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import type { WebhookDelivery } from '../types/webhooks.types';
import { webhookEventLabels } from '../types/webhooks.types';

interface DeliveryLogTableProps {
  deliveries: WebhookDelivery[];
  isLoading?: boolean;
  onRetry: (delivery: WebhookDelivery) => void;
  onViewDetails: (delivery: WebhookDelivery) => void;
  retryingIds?: Set<string>;
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// ============================================================================
// Expandable Event Cell
// ============================================================================

function EventCell({ delivery }: { delivery: WebhookDelivery }) {
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
        aria-label={`${expanded ? 'Collapse' : 'Expand'} delivery details`}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">
            {webhookEventLabels[delivery.event]}
          </span>
        </div>
      </button>
      {expanded && (
        <div className="mt-3 ml-5 space-y-2 rounded-md bg-muted/30 p-3 text-sm">
          {delivery.errorMessage && (
            <p>
              <span className="font-medium text-destructive">Error:</span>{' '}
              <span className="text-muted-foreground">{delivery.errorMessage}</span>
            </p>
          )}
          {delivery.nextRetryAt && (
            <p>
              <span className="font-medium">Next Retry:</span>{' '}
              {formatDate(delivery.nextRetryAt)}
            </p>
          )}
          <p>
            <span className="font-medium">Delivery ID:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{delivery.id}</code>
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Columns
// ============================================================================

const columns: TableColumn<WebhookDelivery>[] = [
  {
    id: 'event',
    header: 'Event',
    accessor: 'event',
    cell: (row) => <EventCell delivery={row} />,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    cell: (row) => <DeliveryStatusBadge status={row.status} />,
  },
  {
    id: 'attempts',
    header: 'Attempts',
    accessor: (row) => row.attempt,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.attempt}/{row.maxAttempts}
      </span>
    ),
    hideOnMobile: true,
  },
  {
    id: 'httpStatusCode',
    header: 'HTTP Status',
    accessor: 'httpStatusCode',
    cell: (row) => {
      const code = row.httpStatusCode;
      const className =
        code && code >= 200 && code < 300
          ? 'text-success-foreground'
          : code
            ? 'text-destructive'
            : 'text-muted-foreground';
      return <span className={`text-sm ${className}`}>{code ?? '-'}</span>;
    },
    hideOnTablet: true,
  },
  {
    id: 'time',
    header: 'Time',
    accessor: (row) => row.deliveredAt || row.createdAt,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.deliveredAt || row.createdAt)}
      </span>
    ),
  },
];

// ============================================================================
// Component
// ============================================================================

export function DeliveryLogTable({
  deliveries,
  isLoading = false,
  onRetry,
  onViewDetails,
  retryingIds = new Set(),
}: DeliveryLogTableProps) {
  const rowActions = useMemo<RowAction<WebhookDelivery>[]>(
    () => [
      {
        id: 'details',
        label: 'Details',
        icon: <FileText className="h-4 w-4" />,
        onClick: onViewDetails,
      },
      {
        id: 'retry',
        label: 'Retry',
        icon: <RefreshCw className="h-4 w-4" />,
        hidden: (row) => row.status !== 'FAILED' && row.status !== 'EXHAUSTED',
        disabled: (row) => retryingIds.has(row.id),
        onClick: onRetry,
      },
    ],
    [onRetry, onViewDetails, retryingIds]
  );

  return (
    <BaseTable
      data={deliveries}
      columns={columns}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      rowActions={rowActions}
      emptyTitle="No deliveries yet"
      emptyDescription="Deliveries will appear here when events are triggered."
    />
  );
}
