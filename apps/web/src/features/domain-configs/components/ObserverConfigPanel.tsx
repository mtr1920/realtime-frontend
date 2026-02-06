/**
 * ObserverConfigPanel Component
 *
 * Configuration panel for observer settings within domain configs.
 * Allows setting max observers and their permissions.
 */

import { forwardRef } from 'react';
import { Eye, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Checkbox,
  Switch,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface ObserverConfig {
  /** Whether observers are enabled */
  enabled: boolean;
  /** Maximum number of observers allowed */
  maxObservers: number;
  /** Observer permissions */
  permissions: {
    /** Can view live transcript */
    canViewTranscript: boolean;
    /** Can view recordings after session */
    canViewRecording: boolean;
    /** Can view AI interactions */
    canViewAIInteractions: boolean;
    /** Can view compliance events */
    canViewCompliance: boolean;
  };
}

interface ObserverConfigPanelProps {
  /** Current observer configuration */
  value: ObserverConfig;
  /** Callback when configuration changes */
  onChange: (value: ObserverConfig) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Default Values
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const defaultObserverConfig: ObserverConfig = {
  enabled: true,
  maxObservers: 10,
  permissions: {
    canViewTranscript: true,
    canViewRecording: true,
    canViewAIInteractions: false,
    canViewCompliance: false,
  },
};

// =============================================================================
// Component
// =============================================================================

export const ObserverConfigPanel = forwardRef<HTMLDivElement, ObserverConfigPanelProps>(
  ({ value, onChange, disabled = false, className }, ref) => {
    const handleToggleEnabled = (enabled: boolean) => {
      onChange({ ...value, enabled });
    };

    const handleMaxObserversChange = (maxObservers: number) => {
      onChange({ ...value, maxObservers: Math.max(0, Math.min(100, maxObservers)) });
    };

    const handlePermissionChange = (
      permission: keyof ObserverConfig['permissions'],
      checked: boolean
    ) => {
      onChange({
        ...value,
        permissions: {
          ...value.permissions,
          [permission]: checked,
        },
      });
    };

    return (
      <Card ref={ref} className={cn('', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Observer Settings</CardTitle>
                <CardDescription>
                  Configure who can observe sessions without participating.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={value.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={disabled}
              aria-label="Enable observers"
            />
          </div>
        </CardHeader>

        {value.enabled && (
          <CardContent className="space-y-6">
            {/* Max Observers */}
            <div className="space-y-2">
              <Label htmlFor="maxObservers" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Maximum Observers
              </Label>
              <Input
                id="maxObservers"
                type="number"
                min={0}
                max={100}
                value={value.maxObservers}
                onChange={(e) => handleMaxObserversChange(parseInt(e.target.value, 10) || 0)}
                disabled={disabled}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of observers allowed per session (0-100).
              </p>
            </div>

            {/* Observer Permissions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Observer Permissions</Label>

              <div className="space-y-3 pl-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.permissions.canViewTranscript}
                    onCheckedChange={(checked) =>
                      handlePermissionChange('canViewTranscript', checked === true)
                    }
                    disabled={disabled}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">View Transcript</span>
                    <p className="text-xs text-muted-foreground">
                      Allow observers to view the live transcript during the session.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.permissions.canViewRecording}
                    onCheckedChange={(checked) =>
                      handlePermissionChange('canViewRecording', checked === true)
                    }
                    disabled={disabled}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">View Recordings</span>
                    <p className="text-xs text-muted-foreground">
                      Allow observers to access session recordings after completion.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.permissions.canViewAIInteractions}
                    onCheckedChange={(checked) =>
                      handlePermissionChange('canViewAIInteractions', checked === true)
                    }
                    disabled={disabled}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">View AI Interactions</span>
                    <p className="text-xs text-muted-foreground">
                      Allow observers to see AI actor interactions and responses.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.permissions.canViewCompliance}
                    onCheckedChange={(checked) =>
                      handlePermissionChange('canViewCompliance', checked === true)
                    }
                    disabled={disabled}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">View Compliance Events</span>
                    <p className="text-xs text-muted-foreground">
                      Allow observers to see compliance violations and events.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

ObserverConfigPanel.displayName = 'ObserverConfigPanel';
