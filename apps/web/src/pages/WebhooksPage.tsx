/**
 * WebhooksPage
 * Admin page for managing webhook endpoints.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  useWebhooks,
  useDeleteWebhook,
  useUpdateWebhook,
  WebhookTable,
  CreateWebhookDialog,
  EditWebhookDialog,
  DeleteWebhookDialog,
  SecretRevealDialog,
  type Webhook,
} from '@/features/webhooks';
import { DeliveryHistoryDialog } from '@/features/webhooks/components/DeliveryLogDialog';
import { showSuccess, handleError } from '@/shared/errors';

export function WebhooksPage() {
  // Search and filter state
  const [search, setSearch] = useState('');

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);
  const [viewingDeliveriesFor, setViewingDeliveriesFor] = useState<Webhook | null>(null);
  const [rotatingSecretFor, setRotatingSecretFor] = useState<Webhook | null>(null);

  // Fetch webhooks
  const { webhooks, isLoading, invalidate } = useWebhooks({
    search: search || undefined,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  // Delete mutation
  const { deleteWebhook, isLoading: isDeleting } = useDeleteWebhook({
    onSuccess: () => {
      setDeletingWebhook(null);
      showSuccess('Webhook deleted successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to delete webhook' });
    },
  });

  // Update mutation (for enable/disable)
  const { updateWebhook } = useUpdateWebhook({
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to update webhook' });
    },
  });

  const handleEdit = useCallback((webhook: Webhook) => {
    setEditingWebhook(webhook);
  }, []);

  const handleDelete = useCallback((webhook: Webhook) => {
    setDeletingWebhook(webhook);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingWebhook) {
      await deleteWebhook(deletingWebhook.id);
    }
  }, [deletingWebhook, deleteWebhook]);

  const handleViewDeliveries = useCallback((webhook: Webhook) => {
    setViewingDeliveriesFor(webhook);
  }, []);

  const handleToggleEnabled = useCallback(
    async (webhook: Webhook) => {
      await updateWebhook({
        id: webhook.id,
        data: { enabled: !webhook.enabled },
      });
    },
    [updateWebhook]
  );

  return (
    <PermissionGate permission="canManageIntegrations" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">
              Manage webhook endpoints for event notifications
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            Create Webhook
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Webhooks</CardTitle>
            <CardDescription>Search by name or URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search webhooks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
                aria-label="Search webhooks"
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Endpoints</CardTitle>
            <CardDescription>
              {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <WebhooksSkeleton />
            ) : (
              <WebhookTable
                webhooks={webhooks}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDeliveries={handleViewDeliveries}
                onToggleEnabled={handleToggleEnabled}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateWebhookDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />

        <EditWebhookDialog
          webhook={editingWebhook}
          open={!!editingWebhook}
          onOpenChange={(open) => !open && setEditingWebhook(null)}
        />

        <DeleteWebhookDialog
          webhook={deletingWebhook}
          open={!!deletingWebhook}
          onOpenChange={(open) => !open && setDeletingWebhook(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />

        <DeliveryHistoryDialog
          webhook={viewingDeliveriesFor}
          open={!!viewingDeliveriesFor}
          onOpenChange={(open) => !open && setViewingDeliveriesFor(null)}
        />

        <SecretRevealDialog
          webhook={rotatingSecretFor}
          open={!!rotatingSecretFor}
          onOpenChange={(open) => !open && setRotatingSecretFor(null)}
        />
      </div>
    </PermissionGate>
  );
}

function WebhooksSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={`skeleton-${i}`} className="h-20 w-full" />
      ))}
    </div>
  );
}

function UnauthorizedMessage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">
            You don't have permission to manage webhooks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
