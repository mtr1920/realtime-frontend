/**
 * BasicSettingsPanel Component
 *
 * Extracted basic fields from DomainConfigForm for tab organization.
 * Includes name, domainType, version (readonly), isDefault, and isActive.
 */

import { forwardRef } from 'react';
import { Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  domainTypeLabels,
  domainTypeValues,
  type DomainType,
} from '../types/domain-configs.types';

// =============================================================================
// Types
// =============================================================================

export interface BasicSettings {
  /** Configuration name */
  name: string;
  /** Domain type (only editable in create mode) */
  domainType: DomainType;
  /** Version number (readonly in edit mode) */
  version?: number;
  /** Whether this is the default config for the domain type */
  isDefault: boolean;
  /** Whether the configuration is active */
  isActive?: boolean;
}

interface BasicSettingsPanelProps {
  /** Current settings values */
  value: BasicSettings;
  /** Callback when settings change */
  onChange: (value: BasicSettings) => void;
  /** Form mode - determines which fields are editable */
  mode: 'create' | 'edit';
  /** Field errors */
  errors?: {
    name?: string;
    domainType?: string;
  };
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const BasicSettingsPanel = forwardRef<HTMLDivElement, BasicSettingsPanelProps>(
  ({ value, onChange, mode, errors, disabled = false, className }, ref) => {
    const handleNameChange = (name: string) => {
      onChange({ ...value, name });
    };

    const handleDomainTypeChange = (domainType: DomainType) => {
      onChange({ ...value, domainType });
    };

    const handleIsDefaultChange = (isDefault: boolean) => {
      onChange({ ...value, isDefault });
    };

    const handleIsActiveChange = (isActive: boolean) => {
      onChange({ ...value, isActive });
    };

    return (
      <Card ref={ref} className={cn('', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Basic Settings</CardTitle>
              <CardDescription>
                Configure the name and type for this domain configuration.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="config-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="config-name"
              placeholder="My Configuration"
              value={value.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={cn(errors?.name && 'border-destructive')}
              aria-invalid={!!errors?.name}
              aria-describedby={errors?.name ? 'config-name-error' : undefined}
              disabled={disabled}
            />
            {errors?.name && (
              <p id="config-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          {/* Domain Type Field */}
          {mode === 'create' ? (
            <div className="space-y-2">
              <Label htmlFor="config-domainType">
                Domain Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value.domainType}
                onValueChange={(v) => handleDomainTypeChange(v as DomainType)}
                disabled={disabled}
              >
                <SelectTrigger
                  id="config-domainType"
                  className={cn(errors?.domainType && 'border-destructive')}
                >
                  <SelectValue placeholder="Select domain type" />
                </SelectTrigger>
                <SelectContent>
                  {domainTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      {domainTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.domainType && (
                <p className="text-sm text-destructive">{errors.domainType}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Domain Type</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                {domainTypeLabels[value.domainType] || value.domainType}
              </div>
              <p className="text-xs text-muted-foreground">
                Domain type cannot be changed after creation.
              </p>
            </div>
          )}

          {/* Version (Edit mode only) */}
          {mode === 'edit' && value.version !== undefined && (
            <div className="space-y-2">
              <Label>Version</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                v{value.version}
              </div>
            </div>
          )}

          {/* Is Default Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="config-isDefault"
              checked={value.isDefault}
              onCheckedChange={(checked) => handleIsDefaultChange(checked === true)}
              disabled={disabled}
            />
            <Label htmlFor="config-isDefault" className="cursor-pointer">
              Set as default configuration for this domain type
            </Label>
          </div>

          {/* Is Active Checkbox (Edit mode only) */}
          {mode === 'edit' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="config-isActive"
                checked={value.isActive}
                onCheckedChange={(checked) => handleIsActiveChange(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="config-isActive" className="cursor-pointer">
                Configuration is active
              </Label>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

BasicSettingsPanel.displayName = 'BasicSettingsPanel';
