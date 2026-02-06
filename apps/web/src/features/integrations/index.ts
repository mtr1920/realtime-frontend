/**
 * Integrations Feature
 * Public exports for the integration connector management module.
 */

// Types
export {
  connectorTypeLabels,
  syncStatusLabels,
  syncTriggerLabels,
  authTypeLabels,
  type Connector,
  type SyncRecord,
  type ConnectorType,
  type SyncStatus,
  type SyncTrigger,
  type SyncDirection,
  type AuthType,
  type AuthConfig,
  type ConnectorConfig,
  type FieldMapping,
  type TriggerConfig,
  type ConnectorListParams,
  type PaginatedConnectorsResponse,
  type SyncListParams,
  type PaginatedSyncsResponse,
  type CreateConnectorInput,
  type UpdateConnectorInput,
} from './types/integrations.types';

// Schemas
export {
  connectorTypeSchema,
  syncStatusSchema,
  syncTriggerSchema,
  syncDirectionSchema,
  authTypeSchema,
  authConfigSchema,
  connectorConfigSchema,
  fieldMappingSchema,
  triggerConfigSchema,
  createConnectorSchema,
  updateConnectorSchema,
  connectorFiltersSchema,
  type ConnectorTypeEnum,
  type SyncStatusEnum,
  type SyncTriggerEnum,
  type SyncDirectionEnum,
  type AuthTypeEnum,
  type CreateConnectorFormData,
  type UpdateConnectorFormData,
  type ConnectorFiltersFormData,
} from './schemas/integrations.schema';

// API Service
export { integrationsService } from './api/integrations.service';

// Hooks
export { useConnectors } from './hooks/useConnectors';
export { useConnector } from './hooks/useConnector';
export { useCreateConnector } from './hooks/useCreateConnector';
export { useUpdateConnector } from './hooks/useUpdateConnector';
export { useDeleteConnector } from './hooks/useDeleteConnector';
export { useTriggerSync } from './hooks/useTriggerSync';
export { useSyncHistory } from './hooks/useSyncHistory';
export { useCancelSync } from './hooks/useCancelSync';

// Components
export { ConnectorHealthBadge } from './components/ConnectorHealthBadge';
export { SyncStatusBadge } from './components/SyncStatusBadge';
export { ConnectorTable } from './components/ConnectorTable';
export { SyncHistoryTable } from './components/SyncHistoryTable';
export { ConnectorDialog } from './components/ConnectorDialog';
export { DeleteConnectorDialog } from './components/DeleteConnectorDialog';
export { SyncDetailDialog } from './components/SyncDetailDialog';
export { SyncHistoryDialog } from './components/SyncHistoryDialog';
