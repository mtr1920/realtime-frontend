/**
 * DeviceSelector Component
 *
 * Dropdown selector for media devices (camera, microphone, speaker).
 * Uses shadcn/ui Select component with proper accessibility.
 */

import { forwardRef } from 'react';
import { Mic, Speaker, Video, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Label,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { MediaDevice } from '@/types';

// =============================================================================
// Types
// =============================================================================

type DeviceType = 'audioinput' | 'audiooutput' | 'videoinput';

interface DeviceSelectorProps {
  /** Type of device to select */
  type: DeviceType;
  /** Available devices */
  devices: MediaDevice[];
  /** Currently selected device ID */
  selectedDeviceId: string | null;
  /** Callback when device is selected */
  onDeviceSelect: (deviceId: string) => void;
  /** Callback to refresh device list */
  onRefresh?: () => void;
  /** Label for the selector */
  label?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Compact mode (no label) */
  compact?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function getDeviceIcon(type: DeviceType) {
  switch (type) {
    case 'audioinput':
      return Mic;
    case 'audiooutput':
      return Speaker;
    case 'videoinput':
      return Video;
  }
}

function getDefaultLabel(type: DeviceType): string {
  switch (type) {
    case 'audioinput':
      return 'Microphone';
    case 'audiooutput':
      return 'Speaker';
    case 'videoinput':
      return 'Camera';
  }
}

function getPlaceholder(type: DeviceType): string {
  switch (type) {
    case 'audioinput':
      return 'Select microphone';
    case 'audiooutput':
      return 'Select speaker';
    case 'videoinput':
      return 'Select camera';
  }
}

// =============================================================================
// Component
// =============================================================================

export const DeviceSelector = forwardRef<HTMLButtonElement, DeviceSelectorProps>(
  (
    {
      type,
      devices,
      selectedDeviceId,
      onDeviceSelect,
      onRefresh,
      label,
      disabled = false,
      className,
      showRefresh = false,
      compact = false,
    },
    ref
  ) => {
    const Icon = getDeviceIcon(type);
    const displayLabel = label ?? getDefaultLabel(type);
    const placeholder = getPlaceholder(type);

    const hasDevices = devices.length > 0;
    const isDisabled = disabled || !hasDevices;

    // Find current device label
    const currentDevice = devices.find((d) => d.deviceId === selectedDeviceId);

    return (
      <div className={cn('space-y-2', className)}>
        {!compact && (
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Icon className="h-4 w-4" />
              {displayLabel}
            </Label>
            {showRefresh && onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRefresh}
                title="Refresh devices"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <Select
          value={selectedDeviceId ?? undefined}
          onValueChange={onDeviceSelect}
          disabled={isDisabled}
        >
          <SelectTrigger ref={ref} className="w-full">
            {compact && <Icon className="mr-2 h-4 w-4 shrink-0" />}
            <SelectValue placeholder={placeholder}>
              {currentDevice?.label ?? placeholder}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {!hasDevices ? (
              <div className="py-2 px-2 text-sm text-muted-foreground">
                No devices found
              </div>
            ) : (
              devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

DeviceSelector.displayName = 'DeviceSelector';
