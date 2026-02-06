/**
 * Domain Config Dialog
 * Modal dialogs for creating and editing domain configurations.
 *
 * Create dialog features a two-step flow:
 * 1. Template Selection - Choose a template or start from scratch
 * 2. Form Editing - Edit the configuration with tabbed panels
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, FileCode, Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import { DomainConfigForm } from './DomainConfigForm';
import { ConfigTemplateSelector } from './ConfigTemplateSelector';
import { useCreateDomainConfig } from '../hooks/useCreateDomainConfig';
import { useUpdateDomainConfig } from '../hooks/useUpdateDomainConfig';
import type { DomainConfig } from '../types/domain-configs.types';
import type { ConfigTemplate } from '../data/config-templates';
import type {
  CreateDomainConfigFormData,
  UpdateDomainConfigFormData,
} from '../schemas/domain-configs.schema';

// =============================================================================
// Create Dialog Types
// =============================================================================

type CreateDialogStep = 'template' | 'form';

interface CreateDomainConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Initial values for duplicating a config */
  initialValues?: {
    name?: string;
    domainType?: DomainConfig['domainType'];
    configJson?: Record<string, unknown>;
  };
  /** Skip template selection and go directly to form */
  skipTemplateSelection?: boolean;
}

// =============================================================================
// Create Dialog Component
// =============================================================================

export function CreateDomainConfigDialog({
  open,
  onOpenChange,
  onSuccess,
  initialValues,
  skipTemplateSelection = false,
}: CreateDomainConfigDialogProps) {
  const [step, setStep] = useState<CreateDialogStep>(
    skipTemplateSelection || initialValues ? 'form' : 'template'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(null);
  // Track if user has potentially made changes in the form step
  const [hasFormInteraction, setHasFormInteraction] = useState(false);

  const { createConfig, isLoading } = useCreateDomainConfig({
    onSuccess: () => {
      handleClose();
      onSuccess?.();
    },
  });

  const handleSubmit = async (data: CreateDomainConfigFormData) => {
    await createConfig(data);
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state immediately - Radix Dialog manages animation independently
    // No setTimeout needed; dialog unmounts async, state reset is synchronous
    setStep(skipTemplateSelection || initialValues ? 'form' : 'template');
    setSelectedTemplate(null);
    setHasFormInteraction(false);
  }, [onOpenChange, skipTemplateSelection, initialValues]);

  const handleSelectTemplate = useCallback((template: ConfigTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const handleUseTemplate = useCallback(() => {
    setStep('form');
    // Mark as having interaction since user will likely edit the form
    setHasFormInteraction(true);
  }, []);

  const handleStartFromScratch = useCallback(() => {
    setSelectedTemplate(null);
    setStep('form');
    // Mark as having interaction since user will likely edit the form
    setHasFormInteraction(true);
  }, []);

  const handleBackToTemplates = useCallback(() => {
    // Warn if user may have unsaved changes
    if (hasFormInteraction) {
      const confirmed = window.confirm(
        'You have unsaved changes. Discard and go back to templates?'
      );
      if (!confirmed) return;
    }
    setStep('template');
    setHasFormInteraction(false);
  }, [hasFormInteraction]);

  // Determine initial form values
  const getFormInitialValues = (): Partial<CreateDomainConfigFormData> | undefined => {
    if (initialValues) {
      return initialValues;
    }
    if (selectedTemplate) {
      return {
        name: selectedTemplate.name,
        domainType: selectedTemplate.domainType,
        configJson: selectedTemplate.configJson,
      };
    }
    return undefined;
  };

  const isDuplicating = !!initialValues;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        {step === 'template' && !isDuplicating ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Domain Configuration</DialogTitle>
              <DialogDescription>
                Choose a template to get started quickly, or create a configuration from
                scratch.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              <ConfigTemplateSelector
                onSelect={handleSelectTemplate}
                selectedTemplateId={selectedTemplate?.id}
              />

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleStartFromScratch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start from Scratch
                </Button>
                <Button
                  onClick={handleUseTemplate}
                  disabled={!selectedTemplate}
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {!isDuplicating && !skipTemplateSelection && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToTemplates}
                    className="h-8 w-8"
                    aria-label="Back to template selection"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <DialogTitle>
                    {isDuplicating
                      ? 'Duplicate Domain Configuration'
                      : selectedTemplate
                        ? `New Configuration from "${selectedTemplate.name}"`
                        : 'Create Domain Configuration'}
                  </DialogTitle>
                  <DialogDescription>
                    {isDuplicating
                      ? 'Create a copy of this domain configuration with a new name.'
                      : selectedTemplate
                        ? 'Customize the template settings for your use case.'
                        : 'Configure the settings for sessions in this domain.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4">
              <DomainConfigForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isLoading}
                initialValues={getFormInitialValues()}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Edit Dialog Component
// =============================================================================

interface EditDomainConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DomainConfig;
  onSuccess?: () => void;
}

export function EditDomainConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: EditDomainConfigDialogProps) {
  const { updateConfig, isLoading } = useUpdateDomainConfig({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = async (data: UpdateDomainConfigFormData) => {
    await updateConfig(config.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Domain Configuration</DialogTitle>
          <DialogDescription>
            Update the configuration settings. Changes will affect all new sessions using
            this configuration.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <DomainConfigForm
            mode="edit"
            config={config}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
