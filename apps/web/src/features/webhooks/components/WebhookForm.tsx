/**
 * WebhookForm Component
 * Form for creating and editing webhooks.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Switch } from '@/shared/ui';
import { WebhookEventsSelect } from './WebhookEventsSelect';
import {
  createWebhookSchema,
  type CreateWebhookFormData,
  type UpdateWebhookFormData,
} from '../schemas/webhooks.schema';
import type { Webhook, WebhookEvent } from '../types/webhooks.types';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

interface WebhookFormProps {
  webhook?: Webhook;
  onSubmit: (data: CreateWebhookFormData | UpdateWebhookFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEFAULT_RETRY_POLICY = {
  maxAttempts: 5,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 3600000,
};

export function WebhookForm({
  webhook,
  onSubmit,
  onCancel,
  isLoading = false,
}: WebhookFormProps) {
  const isEditing = !!webhook;

  const form = useForm({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: webhook
      ? {
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          enabled: webhook.enabled,
          retryPolicy: webhook.retryPolicy,
        }
      : {
          name: '',
          url: '',
          events: [] as WebhookEvent[],
          enabled: true,
          retryPolicy: DEFAULT_RETRY_POLICY,
        },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = form;

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    await onSubmit(data as CreateWebhookFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="My Webhook"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {errors.name.message as string}
          </p>
        )}
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">Endpoint URL</Label>
        <Input
          id="url"
          {...register('url')}
          placeholder="https://example.com/webhook"
          type="url"
          disabled={isLoading}
          aria-invalid={!!errors.url}
          aria-describedby={errors.url ? 'url-error' : undefined}
        />
        {errors.url && (
          <p id="url-error" className="text-sm text-destructive">
            {errors.url.message as string}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Must be a valid HTTPS URL
        </p>
      </div>

      {/* Events */}
      <Controller
        name="events"
        control={control}
        render={({ field }) => (
          <WebhookEventsSelect
            value={field.value as WebhookEvent[]}
            onChange={field.onChange}
            disabled={isLoading}
            error={errors.events?.message as string}
          />
        )}
      />

      {/* Enabled */}
      <div className="flex items-center justify-between rounded-md border border-border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enabled</Label>
          <p className="text-sm text-muted-foreground">
            When disabled, events won't be sent to this webhook
          </p>
        </div>
        <Controller
          name="enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="enabled"
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
              disabled={isLoading}
              aria-label="Enable webhook"
            />
          )}
        />
      </div>

      {/* Retry Policy (Collapsible Advanced Section) */}
      <details className="rounded-md border border-border">
        <summary className="cursor-pointer p-4 font-medium">
          Advanced: Retry Policy
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                min={1}
                max={10}
                {...register('retryPolicy.maxAttempts', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backoffMultiplier">Backoff Multiplier</Label>
              <Input
                id="backoffMultiplier"
                type="number"
                min={1}
                max={5}
                step={0.5}
                {...register('retryPolicy.backoffMultiplier', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialDelayMs">Initial Delay (ms)</Label>
              <Input
                id="initialDelayMs"
                type="number"
                min={1000}
                max={60000}
                step={1000}
                {...register('retryPolicy.initialDelayMs', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDelayMs">Max Delay (ms)</Label>
              <Input
                id="maxDelayMs"
                type="number"
                min={60000}
                max={3600000}
                step={60000}
                {...register('retryPolicy.maxDelayMs', { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || (!isEditing && !isDirty)}
        >
          {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Webhook'}
        </Button>
      </div>
    </form>
  );
}
