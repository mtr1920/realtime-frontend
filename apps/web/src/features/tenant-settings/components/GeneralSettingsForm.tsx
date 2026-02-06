/**
 * GeneralSettingsForm Component
 * Form for editing general tenant settings.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { updateTenantSchema, type UpdateTenantFormData } from '../schemas/tenant-settings.schema';
import { timezoneOptions, languageOptions, type Tenant } from '../types/tenant-settings.types';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

interface GeneralSettingsFormProps {
  tenant: Tenant;
  onSubmit: (data: UpdateTenantFormData) => Promise<void>;
  isLoading?: boolean;
}

export function GeneralSettingsForm({
  tenant,
  onSubmit,
  isLoading = false,
}: GeneralSettingsFormProps) {
  const form = useForm({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: tenant.name,
      settings: {
        defaultTimezone: tenant.settings.defaultTimezone || '',
        defaultLanguage: tenant.settings.defaultLanguage || '',
        defaultDomainType: tenant.settings.defaultDomainType || '',
      },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form;

  const timezone = watch('settings.defaultTimezone');
  const language = watch('settings.defaultLanguage');

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    await onSubmit(data as UpdateTenantFormData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Tenant Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          {...register('name')}
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

      {/* Default Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Default Timezone</Label>
        <Select
          value={timezone}
          onValueChange={(value) => setValue('settings.defaultTimezone', value, { shouldDirty: true })}
          disabled={isLoading}
        >
          <SelectTrigger id="timezone" aria-label="Select timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Default Language */}
      <div className="space-y-2">
        <Label htmlFor="language">Default Language</Label>
        <Select
          value={language}
          onValueChange={(value) => setValue('settings.defaultLanguage', value, { shouldDirty: true })}
          disabled={isLoading}
        >
          <SelectTrigger id="language" aria-label="Select language">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Default Domain Type */}
      <div className="space-y-2">
        <Label htmlFor="domainType">Default Domain Type</Label>
        <Input
          id="domainType"
          {...register('settings.defaultDomainType')}
          placeholder="e.g., interview, consulting"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          The default domain configuration for new workspaces
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
