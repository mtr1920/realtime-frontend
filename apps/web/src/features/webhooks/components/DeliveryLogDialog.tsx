/**
 * DeliveryLogDialog Component
 * Dialog for viewing webhook delivery details.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { DeliveryStatusBadge } from './DeliveryStatusBadge';
import { useWebhookDeliveries } from '../hooks/useWebhookDeliveries';
import { useRetryDelivery } from '../hooks/useRetryDelivery';
import { DeliveryLogTable } from './DeliveryLogTable';
import { showSuccess, handleError } from '@/shared/errors';
import type { Webhook, WebhookDelivery } from '../types/webhooks.types';
import { webhookEventLabels } from '../types/webhooks.types';
import { useState, useCallback } from 'react';

// =============================================================================
// Delivery History Dialog (shows all deliveries for a webhook)
// =============================================================================

interface DeliveryHistoryDialogProps {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryHistoryDialog({
  webhook,
  open,
  onOpenChange,
}: DeliveryHistoryDialogProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const { deliveries, isLoading, refetch } = useWebhookDeliveries(webhook?.id, {
    enabled: open && !!webhook?.id,
    limit: 50,
  });

  const { retryDelivery } = useRetryDelivery({
    onSuccess: () => {
      showSuccess('Delivery queued for retry');
      refetch();
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to retry delivery' });
    },
  });

  const handleRetry = useCallback(
    async (delivery: WebhookDelivery) => {
      if (!webhook) return;
      setRetryingIds((prev) => new Set(prev).add(delivery.id));
      try {
        await retryDelivery({ webhookId: webhook.id, deliveryId: delivery.id });
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(delivery.id);
          return next;
        });
      }
    },
    [webhook, retryDelivery]
  );

  const handleViewDetails = useCallback((delivery: WebhookDelivery) => {
    setSelectedDelivery(delivery);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedDelivery(null);
  }, []);

  if (!webhook) return null;

  return (
    <>
      <Dialog open={open && !selectedDelivery} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              Recent delivery attempts for {webhook.name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <DeliveryLogTable
              deliveries={deliveries}
              isLoading={isLoading}
              onRetry={handleRetry}
              onViewDetails={handleViewDetails}
              retryingIds={retryingIds}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <DeliveryDetailsDialog
        delivery={selectedDelivery}
        open={!!selectedDelivery}
        onOpenChange={(open) => !open && handleCloseDetails()}
      />
    </>
  );
}

// =============================================================================
// Delivery Details Dialog (shows single delivery details)
// =============================================================================

interface DeliveryDetailsDialogProps {
  delivery: WebhookDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliveryDetailsDialog({
  delivery,
  open,
  onOpenChange,
}: DeliveryDetailsDialogProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (jsonString: string | undefined) => {
    if (!jsonString) return '-';
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  if (!delivery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogDescription>
            {webhookEventLabels[delivery.event]} - {formatDate(delivery.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <DeliveryStatusBadge status={delivery.status} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">HTTP Status</label>
              <p className="mt-1 text-sm">
                {delivery.httpStatusCode ?? 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Attempts</label>
              <p className="mt-1 text-sm">
                {delivery.attempt} / {delivery.maxAttempts}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Delivered At</label>
              <p className="mt-1 text-sm">
                {formatDate(delivery.deliveredAt)}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {delivery.errorMessage && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Error Message</label>
              <div className="mt-1 rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{delivery.errorMessage}</p>
              </div>
            </div>
          )}

          {/* Request Body */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Request Body</label>
            <pre className="mt-1 overflow-auto rounded-md bg-muted p-3 text-xs max-h-48">
              {formatJson(delivery.requestBody)}
            </pre>
          </div>

          {/* Response Body */}
          {delivery.responseBody && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Response Body</label>
              <pre className="mt-1 overflow-auto rounded-md bg-muted p-3 text-xs max-h-48">
                {formatJson(delivery.responseBody)}
              </pre>
            </div>
          )}

          {/* Delivery ID */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Delivery ID</label>
            <code className="mt-1 block text-xs bg-muted px-2 py-1 rounded">
              {delivery.id}
            </code>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
