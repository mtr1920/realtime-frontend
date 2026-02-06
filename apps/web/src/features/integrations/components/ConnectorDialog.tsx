/**
 * ConnectorDialog Component
 * Dialog for creating and editing connectors.
 */

import { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Switch } from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { useCreateConnector } from '../hooks/useCreateConnector';
import { useUpdateConnector } from '../hooks/useUpdateConnector';
import {
  createConnectorSchema,
  type CreateConnectorFormData,
} from '../schemas/integrations.schema';
import {
  connectorTypeLabels,
  authTypeLabels,
  type Connector,
  type ConnectorType,
  type SyncDirection,
  type AuthType,
} from '../types/integrations.types';
import { showSuccess, handleError } from '@/shared/errors';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

interface ConnectorDialogProps {
  connector?: Connector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const connectorTypes: ConnectorType[] = [
  'hrms',
  'crm',
  'lms',
  'ats',
  'webhook',
  'rest',
  'custom',
];

const directions: { value: SyncDirection; label: string }[] = [
  { value: 'push', label: 'Push (Send data)' },
  { value: 'pull', label: 'Pull (Receive data)' },
  { value: 'bidirectional', label: 'Bidirectional' },
];

const authTypes: AuthType[] = ['api_key', 'bearer', 'basic', 'oauth2', 'none'];

export function ConnectorDialog({
  connector,
  open,
  onOpenChange,
}: ConnectorDialogProps) {
  const isEditing = !!connector;

  const { createConnector, isLoading: isCreating } = useCreateConnector({
    onSuccess: () => {
      showSuccess('Connector created successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to create connector' });
    },
  });

  const { updateConnector, isLoading: isUpdating } = useUpdateConnector({
    onSuccess: () => {
      showSuccess('Connector updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to update connector' });
    },
  });

  const form = useForm({
    resolver: zodResolver(createConnectorSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'rest' as ConnectorType,
      direction: 'push' as SyncDirection,
      config: {
        baseUrl: '',
        auth: {
          type: 'api_key' as AuthType,
          apiKey: '',
        },
      },
      enabled: true,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const authType = watch('config.auth.type');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (connector) {
        reset({
          name: connector.name,
          description: connector.description || '',
          type: connector.type,
          direction: connector.direction,
          config: {
            baseUrl: connector.config.baseUrl,
            auth: connector.config.auth,
          },
          enabled: connector.enabled,
        });
      } else {
        reset({
          name: '',
          description: '',
          type: 'rest',
          direction: 'push',
          config: {
            baseUrl: '',
            auth: { type: 'api_key', apiKey: '' },
          },
          enabled: true,
        });
      }
    }
  }, [open, connector, reset]);

  const isLoading = isCreating || isUpdating;

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    const formData = data as CreateConnectorFormData;
    if (isEditing && connector) {
      await updateConnector({ id: connector.id, data: formData });
    } else {
      await createConnector(formData);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Connector' : 'Create Connector'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the connector configuration.'
              : 'Configure a new integration connector.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="My Integration"
                disabled={isLoading}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {connectorTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {connectorTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional description"
              disabled={isLoading}
            />
          </div>

          <Controller
            name="direction"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="direction">Direction</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Connection Config */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="font-medium">Connection</h3>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                {...register('config.baseUrl')}
                placeholder="https://api.example.com"
                disabled={isLoading}
                aria-invalid={!!errors.config?.baseUrl}
              />
              {errors.config?.baseUrl && (
                <p className="text-sm text-destructive">
                  {errors.config.baseUrl.message as string}
                </p>
              )}
            </div>

            <Controller
              name="config.auth.type"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="authType">Authentication</Label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear auth fields when type changes
                      setValue('config.auth.apiKey', '');
                      setValue('config.auth.bearerToken', '');
                      setValue('config.auth.username', '');
                      setValue('config.auth.password', '');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="authType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {authTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {authTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {authType === 'api_key' && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  {...register('config.auth.apiKey')}
                  placeholder="Enter API key"
                  disabled={isLoading}
                />
              </div>
            )}

            {authType === 'bearer' && (
              <div className="space-y-2">
                <Label htmlFor="bearerToken">Bearer Token</Label>
                <Input
                  id="bearerToken"
                  type="password"
                  {...register('config.auth.bearerToken')}
                  placeholder="Enter bearer token"
                  disabled={isLoading}
                />
              </div>
            )}

            {authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...register('config.auth.username')}
                    placeholder="Username"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('config.auth.password')}
                    placeholder="Password"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enabled Toggle */}
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <Label htmlFor="enabled">Enable Connector</Label>
                  <p className="text-xs text-muted-foreground">
                    Syncs will only run when enabled
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </div>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Connector'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
