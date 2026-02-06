/**
 * IntegrationsPage
 * Admin page for managing integration connectors.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  useConnectors,
  useDeleteConnector,
  useTriggerSync,
  ConnectorTable,
  ConnectorDialog,
  DeleteConnectorDialog,
  SyncHistoryDialog,
  type Connector,
} from '@/features/integrations';
import { showSuccess, handleError } from '@/shared/errors';

export function IntegrationsPage() {
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const [deletingConnector, setDeletingConnector] = useState<Connector | null>(null);
  const [viewingSyncs, setViewingSyncs] = useState<Connector | null>(null);

  // Fetch connectors
  const { connectors, isLoading, invalidate } = useConnectors({
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  // Delete mutation
  const { deleteConnector, isLoading: isDeleting } = useDeleteConnector({
    onSuccess: () => {
      setDeletingConnector(null);
      showSuccess('Connector deleted successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to delete connector' });
    },
  });

  // Trigger sync mutation
  const { triggerSync, isLoading: isTriggering } = useTriggerSync({
    onSuccess: () => {
      showSuccess('Sync triggered successfully');
      invalidate();
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to trigger sync' });
    },
  });

  const handleEdit = useCallback((connector: Connector) => {
    setEditingConnector(connector);
  }, []);

  const handleViewSyncs = useCallback((connector: Connector) => {
    setViewingSyncs(connector);
  }, []);

  const handleDelete = useCallback((connector: Connector) => {
    setDeletingConnector(connector);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deletingConnector) {
      await deleteConnector(deletingConnector.id);
    }
  }, [deletingConnector, deleteConnector]);

  const handleTriggerSync = useCallback(
    async (connector: Connector) => {
      await triggerSync(connector.id);
    },
    [triggerSync]
  );

  return (
    <PermissionGate permission="canManageIntegrations" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Integrations</h1>
            <p className="text-muted-foreground">
              Manage connectors for external system integrations
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            Create Connector
          </Button>
        </div>

        {/* Connectors List */}
        <Card>
          <CardHeader>
            <CardTitle>Connectors</CardTitle>
            <CardDescription>
              {connectors.length} connector{connectors.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ConnectorsSkeleton />
            ) : (
              <ConnectorTable
                connectors={connectors}
                isLoading={isLoading || isTriggering}
                onEdit={handleEdit}
                onViewSyncs={handleViewSyncs}
                onDelete={handleDelete}
                onTriggerSync={handleTriggerSync}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <ConnectorDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />

        <ConnectorDialog
          connector={editingConnector}
          open={!!editingConnector}
          onOpenChange={(open) => !open && setEditingConnector(null)}
        />

        <DeleteConnectorDialog
          connector={deletingConnector}
          open={!!deletingConnector}
          onOpenChange={(open) => !open && setDeletingConnector(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />

        <SyncHistoryDialog
          connector={viewingSyncs}
          open={!!viewingSyncs}
          onOpenChange={(open) => !open && setViewingSyncs(null)}
        />
      </div>
    </PermissionGate>
  );
}

function ConnectorsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
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
            You don't have permission to manage integrations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
