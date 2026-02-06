/**
 * Domain Configs Feature
 * Public exports for the domain configuration management module.
 */

// API Service
export {
  domainConfigsService,
  type DomainConfig,
  type DomainType,
  type DomainConfigListParams,
  type PaginatedDomainConfigsResponse,
  type CreateDomainConfigInput,
  type UpdateDomainConfigInput,
} from './api/domain-configs.service';

// Types
export {
  domainTypeLabels,
  domainTypeValues,
} from './types/domain-configs.types';

// Hooks
export { useDomainConfigs, useInfiniteDomainConfigs } from './hooks/useDomainConfigs';
export { useDomainConfig } from './hooks/useDomainConfig';
export { useCreateDomainConfig } from './hooks/useCreateDomainConfig';
export { useUpdateDomainConfig } from './hooks/useUpdateDomainConfig';
export { useDeleteDomainConfig } from './hooks/useDeleteDomainConfig';

// Components
export { DomainConfigTable } from './components/DomainConfigTable';
export { DomainConfigForm } from './components/DomainConfigForm';
export { ConfigJsonEditor } from './components/ConfigJsonEditor';
export {
  CreateDomainConfigDialog,
  EditDomainConfigDialog,
} from './components/DomainConfigDialog';
export {
  ConfigTemplateSelector,
  CompactTemplateSelector,
} from './components/ConfigTemplateSelector';
export {
  ObserverConfigPanel,
  defaultObserverConfig,
  type ObserverConfig,
} from './components/ObserverConfigPanel';
export {
  RecordingConfigPanel,
  defaultRecordingConfig,
  type RecordingConfig,
  type ConsentType,
} from './components/RecordingConfigPanel';
export { AIActorListPanel } from './components/AIActorListPanel';
export {
  BasicSettingsPanel,
  type BasicSettings,
} from './components/BasicSettingsPanel';

// Utilities
export {
  parseConfigJson,
  serializeToConfigJson,
  defaultAIConfig,
  type AIConfig,
  type ParsedDomainConfig,
} from './utils/config-serializer';

// Template Data
export {
  configTemplates,
  getTemplatesForDomain,
  getTemplateById,
  getTemplatesByTag,
  type ConfigTemplate,
} from './data/config-templates';

// Schemas
export {
  createDomainConfigSchema,
  updateDomainConfigSchema,
  domainConfigFiltersSchema,
  type CreateDomainConfigFormData,
  type UpdateDomainConfigFormData,
  type DomainConfigFiltersFormData,
} from './schemas/domain-configs.schema';
