/**
 * API Keys Feature
 * Public exports for the API key management module.
 */

// API Service
export {
  apiKeysService,
  type ApiKey,
  type ApiKeyScope,
  type ApiKeyListParams,
  type PaginatedApiKeysResponse,
  type CreateApiKeyInput,
  type CreateApiKeyResponse,
  type UpdateApiKeyInput,
} from './api/api-keys.service';

// Types
export {
  apiKeyScopeLabels,
  apiKeyScopeGroups,
} from './types/api-keys.types';

// Hooks
export { useApiKeys } from './hooks/useApiKeys';
export { useCreateApiKey } from './hooks/useCreateApiKey';
export { useUpdateApiKey } from './hooks/useUpdateApiKey';
export { useRevokeApiKey } from './hooks/useRevokeApiKey';

// Components
export { ApiKeyTable } from './components/ApiKeyTable';
export { ApiKeyScopesSelect } from './components/ApiKeyScopesSelect';
export {
  CreateApiKeyDialog,
  EditApiKeyDialog,
  RevokeApiKeyDialog,
} from './components/ApiKeyDialog';

// Schemas
export {
  apiKeyScopeSchema,
  createApiKeySchema,
  updateApiKeySchema,
  apiKeyFiltersSchema,
  type ApiKeyScopeEnum,
  type CreateApiKeyFormData,
  type UpdateApiKeyFormData,
  type ApiKeyFiltersFormData,
} from './schemas/api-keys.schema';
