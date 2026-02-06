/**
 * DeleteConnectorDialog Component
 * Confirmation dialog for deleting a connector.
 */

import { ConfirmationDialog } from '@/shared/components';
import type { Connector } from '../types/integrations.types';

interface DeleteConnectorDialogProps {
  connector: Connector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConnectorDialog({
  connector,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteConnectorDialogProps) {
  if (!connector) return null;

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Connector"
      description={`Are you sure you want to delete "${connector.name}"? This action cannot be undone and all sync history will be lost.`}
      confirmLabel="Delete"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  );
}
