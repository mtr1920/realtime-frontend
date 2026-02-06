/**
 * DeviceCheckPanel
 *
 * Enhanced panel for requesting and displaying camera/microphone permissions.
 * Features animated checkmarks and success glow effects.
 */

import { useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/shared/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useDevicePermissions } from '../../hooks/useDevicePermissions';

export interface DeviceCheckPanelProps {
  /** Called when permissions are granted */
  onPermissionsGranted?: (audio: boolean, video: boolean) => void;

  /** Whether to auto-request permissions */
  autoRequest?: boolean;

  /** Additional CSS class */
  className?: string;
}

export function DeviceCheckPanel({
  onPermissionsGranted,
  autoRequest = false,
  className,
}: DeviceCheckPanelProps) {
  const {
    hasAudioPermission,
    hasVideoPermission,
    isRequesting,
    error,
    isChecked,
    requestAllPermissions,
    clearError,
  } = useDevicePermissions();

  // Auto-request permissions if enabled
  useEffect(() => {
    if (autoRequest && isChecked && !hasAudioPermission && !hasVideoPermission) {
      requestAllPermissions();
    }
  }, [autoRequest, isChecked, hasAudioPermission, hasVideoPermission, requestAllPermissions]);

  // Notify parent when permissions change
  useEffect(() => {
    if (isChecked) {
      onPermissionsGranted?.(hasAudioPermission, hasVideoPermission);
    }
  }, [hasAudioPermission, hasVideoPermission, isChecked, onPermissionsGranted]);

  const handleRequestPermissions = async () => {
    clearError();
    await requestAllPermissions();
  };

  const allPermissionsGranted = hasAudioPermission && hasVideoPermission;

  return (
    <Card
      className={cn(
        'w-full transition-all duration-300',
        allPermissionsGranted && 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/10',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Device Permissions
          {allPermissionsGranted && (
            <span className="motion-safe:animate-check-bounce">
              <Check className="h-5 w-5 text-green-500" aria-hidden />
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Allow access to your camera and microphone to join the session.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="grid grid-cols-2 gap-4">
          {/* Audio Permission */}
          <PermissionItem
            granted={hasAudioPermission}
            icon={hasAudioPermission ? Mic : MicOff}
            label="Microphone"
          />

          {/* Video Permission */}
          <PermissionItem
            granted={hasVideoPermission}
            icon={hasVideoPermission ? Video : VideoOff}
            label="Camera"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 motion-safe:animate-fade-in">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-sm font-medium text-destructive">Permission Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Request Button */}
        {!allPermissionsGranted && (
          <Button
            onClick={handleRequestPermissions}
            disabled={isRequesting}
            className="w-full h-12 text-base press-effect"
            size="lg"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 motion-safe:animate-spin" aria-hidden />
                Requesting Access...
              </>
            ) : (
              <>
                <Video className="mr-2 h-5 w-5" aria-hidden />
                Allow Camera & Microphone
              </>
            )}
          </Button>
        )}

        {/* Success Message */}
        {allPermissionsGranted && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg p-4',
              'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
              'border border-green-200 dark:border-green-800',
              'motion-safe:animate-fade-in'
            )}
          >
            <div className="h-3 w-3 rounded-full bg-green-500 motion-safe:animate-pulse" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Devices ready - You're all set!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Permission Item Component
// =============================================================================

interface PermissionItemProps {
  granted: boolean;
  icon: typeof Mic;
  label: string;
}

function PermissionItem({ granted, icon: Icon, label }: PermissionItemProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-300',
        granted
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50'
          : 'border-muted bg-muted/30'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300',
          granted
            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p
          className={cn(
            'text-xs transition-colors',
            granted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
          )}
        >
          {granted ? 'Allowed' : 'Not allowed'}
        </p>
      </div>

      {/* Checkmark badge */}
      {granted && (
        <div
          className={cn(
            'absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full',
            'bg-green-500 flex items-center justify-center',
            'motion-safe:animate-check-bounce'
          )}
        >
          <Check className="h-3.5 w-3.5 text-white" aria-hidden />
        </div>
      )}
    </div>
  );
}
