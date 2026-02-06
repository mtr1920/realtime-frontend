/**
 * BrandingSettingsForm Component
 * Form for editing branding settings.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { brandingConfigSchema, type BrandingConfigFormData } from '../schemas/tenant-settings.schema';
import type { Tenant } from '../types/tenant-settings.types';
import type { FieldValues, SubmitHandler } from 'react-hook-form';

interface BrandingSettingsFormProps {
  tenant: Tenant;
  onSubmit: (data: { settings: { brandingConfig: BrandingConfigFormData } }) => Promise<void>;
  isLoading?: boolean;
}

export function BrandingSettingsForm({
  tenant,
  onSubmit,
  isLoading = false,
}: BrandingSettingsFormProps) {
  const form = useForm({
    resolver: zodResolver(brandingConfigSchema),
    defaultValues: {
      logoUrl: tenant.settings.brandingConfig?.logoUrl || '',
      primaryColor: tenant.settings.brandingConfig?.primaryColor || '',
      companyName: tenant.settings.brandingConfig?.companyName || '',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = form;

  const primaryColor = watch('primaryColor');

  const onFormSubmit: SubmitHandler<FieldValues> = async (data) => {
    await onSubmit({
      settings: {
        brandingConfig: data as BrandingConfigFormData,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          {...register('companyName')}
          placeholder="Your Company Name"
          disabled={isLoading}
          aria-invalid={!!errors.companyName}
          aria-describedby={errors.companyName ? 'company-error' : undefined}
        />
        {errors.companyName && (
          <p id="company-error" className="text-sm text-destructive">
            {errors.companyName.message as string}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Displayed in emails and reports
        </p>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          {...register('logoUrl')}
          placeholder="https://example.com/logo.png"
          disabled={isLoading}
          aria-invalid={!!errors.logoUrl}
          aria-describedby={errors.logoUrl ? 'logo-error' : undefined}
        />
        {errors.logoUrl && (
          <p id="logo-error" className="text-sm text-destructive">
            {errors.logoUrl.message as string}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          URL to your company logo (recommended size: 200x50px)
        </p>
      </div>

      {/* Primary Color */}
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primary Color</Label>
        <div className="flex gap-3">
          <Input
            id="primaryColor"
            {...register('primaryColor')}
            placeholder="#3B82F6"
            disabled={isLoading}
            className="flex-1"
            aria-invalid={!!errors.primaryColor}
            aria-describedby={errors.primaryColor ? 'color-error' : undefined}
          />
          {primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor) && (
            <div
              className="h-10 w-10 rounded-md border border-border"
              style={{ backgroundColor: primaryColor }}
              aria-label={`Color preview: ${primaryColor}`}
            />
          )}
        </div>
        {errors.primaryColor && (
          <p id="color-error" className="text-sm text-destructive">
            {errors.primaryColor.message as string}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Hex color code (e.g., #3B82F6)
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? 'Saving...' : 'Save Branding'}
        </Button>
      </div>
    </form>
  );
}
