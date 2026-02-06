/**
 * Domain Config Form
 * Tabbed form for creating and editing domain configurations.
 *
 * Tabs:
 * 1. Basic - Name, domain type, version, isDefault, isActive
 * 2. AI Actors - List of AI actors with add/edit/delete
 * 3. Recording - Recording configuration panel
 * 4. Observers - Observer configuration panel
 * 5. Advanced - Raw JSON editor
 */

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Settings,
  Sparkles,
  Video,
  Eye,
  Code,
} from 'lucide-react';
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/shared/ui';
import { ErrorBoundary } from '@/shared/components';
import {
  createDomainConfigSchema,
  updateDomainConfigSchema,
  type CreateDomainConfigFormData,
  type UpdateDomainConfigFormData,
} from '../schemas/domain-configs.schema';
import type { DomainConfig, DomainType } from '../types/domain-configs.types';
import { ConfigJsonEditor } from './ConfigJsonEditor';
import { BasicSettingsPanel, type BasicSettings } from './BasicSettingsPanel';
import { AIActorListPanel } from './AIActorListPanel';
import { RecordingConfigPanel } from './RecordingConfigPanel';
import { ObserverConfigPanel } from './ObserverConfigPanel';
import { PanelError } from './PanelError';
import {
  parseConfigJson,
  serializeToConfigJson,
  type ParsedDomainConfig,
} from '../utils/config-serializer';

// Type for syncToForm updater function
type ConfigUpdater = ParsedDomainConfig | ((prev: ParsedDomainConfig) => ParsedDomainConfig);

// =============================================================================
// Types
// =============================================================================

interface CreateDomainConfigFormProps {
  mode: 'create';
  onSubmit: (data: CreateDomainConfigFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  /** Initial values for duplicating a config or from template */
  initialValues?: Partial<CreateDomainConfigFormData>;
}

interface EditDomainConfigFormProps {
  mode: 'edit';
  config: DomainConfig;
  onSubmit: (data: UpdateDomainConfigFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type DomainConfigFormProps = CreateDomainConfigFormProps | EditDomainConfigFormProps;

// =============================================================================
// Main Component
// =============================================================================

export function DomainConfigForm(props: DomainConfigFormProps) {
  const { mode, onSubmit, onCancel, isLoading = false } = props;
  const config = mode === 'edit' ? props.config : undefined;
  const initialValues = mode === 'create' ? props.initialValues : undefined;

  if (mode === 'create') {
    return (
      <CreateForm
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
        initialValues={initialValues}
      />
    );
  }

  return (
    <EditForm
      config={config!}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}

// =============================================================================
// Create Form Component
// =============================================================================

interface CreateFormProps {
  onSubmit: (data: CreateDomainConfigFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  initialValues?: Partial<CreateDomainConfigFormData>;
}

function CreateForm({ onSubmit, onCancel, isLoading, initialValues }: CreateFormProps) {
  const form = useForm<CreateDomainConfigFormData>({
    resolver: zodResolver(createDomainConfigSchema),
    defaultValues: {
      name: initialValues?.name ? `${initialValues.name} (Copy)` : '',
      domainType: initialValues?.domainType ?? 'interview',
      configJson: initialValues?.configJson ?? {},
      isDefault: false,
    },
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;
  const configJson = watch('configJson');

  // Parse configJson into typed sections
  const [parsedConfig, setParsedConfig] = useState<ParsedDomainConfig>(() =>
    parseConfigJson(configJson)
  );

  // Sync parsed config changes back to form using functional updates
  // to prevent stale closure issues when multiple panels edit concurrently
  const syncToForm = useCallback(
    (updater: ConfigUpdater) => {
      setParsedConfig((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setValue('configJson', serializeToConfigJson(next), {
          shouldValidate: true,
        });
        return next;
      });
    },
    [setValue]
  );

  // Basic settings state
  const basicSettings: BasicSettings = {
    name: watch('name'),
    domainType: watch('domainType') as DomainType,
    isDefault: watch('isDefault') ?? false,
  };

  const handleBasicSettingsChange = useCallback(
    (settings: BasicSettings) => {
      setValue('name', settings.name, { shouldValidate: true });
      setValue('domainType', settings.domainType, { shouldValidate: true });
      setValue('isDefault', settings.isDefault);
    },
    [setValue]
  );

  // Handle raw JSON editor changes
  const handleJsonChange = useCallback(
    (json: Record<string, unknown>) => {
      setValue('configJson', json, { shouldValidate: true });
      setParsedConfig(parseConfigJson(json));
    },
    [setValue]
  );

  // Reset parsed config (for error recovery)
  const handleResetParsedConfig = useCallback(() => {
    setParsedConfig(parseConfigJson(configJson));
  }, [configJson]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-1.5" aria-label="Basic settings">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5" aria-label="AI Actors">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="recording" className="flex items-center gap-1.5" aria-label="Recording settings">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Recording</span>
          </TabsTrigger>
          <TabsTrigger value="observers" className="flex items-center gap-1.5" aria-label="Observer settings">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Observers</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1.5" aria-label="Advanced JSON editor">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <BasicSettingsPanel
            mode="create"
            value={basicSettings}
            onChange={handleBasicSettingsChange}
            errors={{ name: errors.name?.message, domainType: errors.domainType?.message }}
            disabled={isLoading}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="AI Actors" onRetry={handleResetParsedConfig} />}>
            <AIActorListPanel
              value={parsedConfig.ai}
              onChange={(ai) => syncToForm((prev) => ({ ...prev, ai }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="recording" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="Recording" onRetry={handleResetParsedConfig} />}>
            <RecordingConfigPanel
              value={parsedConfig.recording}
              onChange={(recording) => syncToForm((prev) => ({ ...prev, recording }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="observers" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="Observers" onRetry={handleResetParsedConfig} />}>
            <ObserverConfigPanel
              value={parsedConfig.observers}
              onChange={(observers) => syncToForm((prev) => ({ ...prev, observers }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <ConfigJsonEditor
            value={configJson}
            onChange={handleJsonChange}
            error={errors.configJson?.message as string | undefined}
            disabled={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
          Create Configuration
        </Button>
      </div>
    </form>
  );
}

// =============================================================================
// Edit Form Component
// =============================================================================

interface EditFormProps {
  config: DomainConfig;
  onSubmit: (data: UpdateDomainConfigFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function EditForm({ config, onSubmit, onCancel, isLoading }: EditFormProps) {
  const form = useForm<UpdateDomainConfigFormData>({
    resolver: zodResolver(updateDomainConfigSchema),
    defaultValues: {
      name: config.name,
      configJson: config.configJson,
      isDefault: config.isDefault,
      isActive: config.isActive,
    },
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;
  const configJson = watch('configJson') ?? config.configJson;

  // Parse configJson into typed sections
  const [parsedConfig, setParsedConfig] = useState<ParsedDomainConfig>(() =>
    parseConfigJson(configJson)
  );

  // NOTE: Removed useEffect that synced configJson → parsedConfig
  // This caused infinite loops when panels edited via syncToForm.
  // The syncToForm function now handles all synchronization.

  // Sync parsed config changes back to form using functional updates
  // to prevent stale closure issues when multiple panels edit concurrently
  const syncToForm = useCallback(
    (updater: ConfigUpdater) => {
      setParsedConfig((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setValue('configJson', serializeToConfigJson(next), {
          shouldValidate: true,
        });
        return next;
      });
    },
    [setValue]
  );

  // Basic settings state
  const basicSettings: BasicSettings = {
    name: watch('name') ?? config.name,
    domainType: config.domainType as DomainType,
    version: config.version,
    isDefault: watch('isDefault') ?? config.isDefault,
    isActive: watch('isActive') ?? config.isActive,
  };

  const handleBasicSettingsChange = useCallback(
    (settings: BasicSettings) => {
      setValue('name', settings.name, { shouldValidate: true });
      setValue('isDefault', settings.isDefault);
      setValue('isActive', settings.isActive);
    },
    [setValue]
  );

  // Handle raw JSON editor changes
  const handleJsonChange = useCallback(
    (json: Record<string, unknown>) => {
      setValue('configJson', json, { shouldValidate: true });
      setParsedConfig(parseConfigJson(json));
    },
    [setValue]
  );

  // Reset parsed config (for error recovery)
  const handleResetParsedConfig = useCallback(() => {
    setParsedConfig(parseConfigJson(configJson));
  }, [configJson]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-1.5" aria-label="Basic settings">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1.5" aria-label="AI Actors">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="recording" className="flex items-center gap-1.5" aria-label="Recording settings">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Recording</span>
          </TabsTrigger>
          <TabsTrigger value="observers" className="flex items-center gap-1.5" aria-label="Observer settings">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Observers</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1.5" aria-label="Advanced JSON editor">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <BasicSettingsPanel
            mode="edit"
            value={basicSettings}
            onChange={handleBasicSettingsChange}
            errors={{ name: errors.name?.message }}
            disabled={isLoading}
          />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="AI Actors" onRetry={handleResetParsedConfig} />}>
            <AIActorListPanel
              value={parsedConfig.ai}
              onChange={(ai) => syncToForm((prev) => ({ ...prev, ai }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="recording" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="Recording" onRetry={handleResetParsedConfig} />}>
            <RecordingConfigPanel
              value={parsedConfig.recording}
              onChange={(recording) => syncToForm((prev) => ({ ...prev, recording }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="observers" className="mt-4">
          <ErrorBoundary fallback={<PanelError panel="Observers" onRetry={handleResetParsedConfig} />}>
            <ObserverConfigPanel
              value={parsedConfig.observers}
              onChange={(observers) => syncToForm((prev) => ({ ...prev, observers }))}
              disabled={isLoading}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <ConfigJsonEditor
            value={configJson}
            onChange={handleJsonChange}
            error={errors.configJson?.message as string | undefined}
            disabled={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
