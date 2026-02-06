/**
 * RecordingConfigPanel Component
 *
 * Configuration panel for recording settings within domain configs.
 * Includes consent type, retention, and audio mix settings.
 */

import { forwardRef } from 'react';
import { Video, Clock, Volume2, Shield } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  RadioGroup,
  RadioGroupItem,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type ConsentType = 'none' | 'implicit' | 'explicit';

export interface RecordingConfig {
  /** Whether recording is enabled */
  enabled: boolean;
  /** Consent type required */
  consentType: ConsentType;
  /** Days to retain recordings */
  retentionDays: number;
  /** Auto-start recording when session begins */
  autoStart: boolean;
  /** Audio mix settings */
  audioMix: {
    /** Include participant audio */
    includeParticipants: boolean;
    /** Include AI actor audio */
    includeAIAudio: boolean;
    /** Include system sounds */
    includeSystemSounds: boolean;
  };
  /** Video settings */
  video: {
    /** Record video streams */
    recordVideo: boolean;
    /** Record screen shares */
    recordScreenShare: boolean;
    /** Video quality */
    quality: 'low' | 'medium' | 'high';
  };
}

interface RecordingConfigPanelProps {
  /** Current recording configuration */
  value: RecordingConfig;
  /** Callback when configuration changes */
  onChange: (value: RecordingConfig) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Default Values
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const defaultRecordingConfig: RecordingConfig = {
  enabled: true,
  consentType: 'explicit',
  retentionDays: 90,
  autoStart: false,
  audioMix: {
    includeParticipants: true,
    includeAIAudio: true,
    includeSystemSounds: false,
  },
  video: {
    recordVideo: true,
    recordScreenShare: true,
    quality: 'medium',
  },
};

// =============================================================================
// Consent Labels
// =============================================================================

const consentLabels: Record<ConsentType, { label: string; description: string }> = {
  none: {
    label: 'No Consent Required',
    description: 'Recording starts without participant consent (check legal requirements).',
  },
  implicit: {
    label: 'Implicit Consent',
    description: 'Participants are notified but consent is assumed by joining.',
  },
  explicit: {
    label: 'Explicit Consent',
    description: 'Participants must actively consent before recording starts.',
  },
};

const qualityLabels: Record<RecordingConfig['video']['quality'], string> = {
  low: '480p - Lower quality, smaller files',
  medium: '720p - Balanced quality and size',
  high: '1080p - Best quality, larger files',
};

// =============================================================================
// Component
// =============================================================================

export const RecordingConfigPanel = forwardRef<HTMLDivElement, RecordingConfigPanelProps>(
  ({ value, onChange, disabled = false, className }, ref) => {
    const handleToggleEnabled = (enabled: boolean) => {
      onChange({ ...value, enabled });
    };

    const handleConsentTypeChange = (consentType: ConsentType) => {
      onChange({ ...value, consentType });
    };

    const handleRetentionChange = (days: number) => {
      onChange({ ...value, retentionDays: Math.max(1, Math.min(365 * 10, days)) });
    };

    const handleAutoStartChange = (autoStart: boolean) => {
      onChange({ ...value, autoStart });
    };

    const handleAudioMixChange = (
      setting: keyof RecordingConfig['audioMix'],
      checked: boolean
    ) => {
      onChange({
        ...value,
        audioMix: {
          ...value.audioMix,
          [setting]: checked,
        },
      });
    };

    const handleVideoChange = (
      setting: keyof Omit<RecordingConfig['video'], 'quality'>,
      checked: boolean
    ) => {
      onChange({
        ...value,
        video: {
          ...value.video,
          [setting]: checked,
        },
      });
    };

    const handleQualityChange = (quality: RecordingConfig['video']['quality']) => {
      onChange({
        ...value,
        video: {
          ...value.video,
          quality,
        },
      });
    };

    return (
      <Card ref={ref} className={cn('', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Recording Settings</CardTitle>
                <CardDescription>
                  Configure session recording, consent, and retention.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={value.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={disabled}
              aria-label="Enable recording"
            />
          </div>
        </CardHeader>

        {value.enabled && (
          <CardContent className="space-y-6">
            {/* Consent Type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Consent Type
              </Label>
              <RadioGroup
                value={value.consentType}
                onValueChange={(v: string) => handleConsentTypeChange(v as ConsentType)}
                disabled={disabled}
                className="space-y-2"
              >
                {(Object.keys(consentLabels) as ConsentType[]).map((type) => (
                  <div key={type} className="flex items-start space-x-3">
                    <RadioGroupItem value={type} id={`consent-${type}`} />
                    <div className="space-y-1">
                      <Label htmlFor={`consent-${type}`} className="cursor-pointer font-medium">
                        {consentLabels[type].label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {consentLabels[type].description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Retention Period */}
            <div className="space-y-2">
              <Label htmlFor="retentionDays" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Retention Period
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="retentionDays"
                  type="number"
                  min={1}
                  max={3650}
                  value={value.retentionDays}
                  onChange={(e) => handleRetentionChange(parseInt(e.target.value, 10) || 90)}
                  disabled={disabled}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Recordings will be automatically deleted after this period.
              </p>
            </div>

            {/* Auto-start */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Auto-start Recording</Label>
                <p className="text-xs text-muted-foreground">
                  Start recording automatically when the session begins.
                </p>
              </div>
              <Switch
                checked={value.autoStart}
                onCheckedChange={handleAutoStartChange}
                disabled={disabled}
              />
            </div>

            {/* Audio Mix Settings */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                Audio Mix
              </Label>

              <div className="space-y-3 pl-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.audioMix.includeParticipants}
                    onCheckedChange={(checked) =>
                      handleAudioMixChange('includeParticipants', checked === true)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm">Include participant audio</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.audioMix.includeAIAudio}
                    onCheckedChange={(checked) =>
                      handleAudioMixChange('includeAIAudio', checked === true)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm">Include AI actor audio</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.audioMix.includeSystemSounds}
                    onCheckedChange={(checked) =>
                      handleAudioMixChange('includeSystemSounds', checked === true)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm">Include system sounds</span>
                </label>
              </div>
            </div>

            {/* Video Settings */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                Video Settings
              </Label>

              <div className="space-y-3 pl-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.video.recordVideo}
                    onCheckedChange={(checked) =>
                      handleVideoChange('recordVideo', checked === true)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm">Record video streams</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.video.recordScreenShare}
                    onCheckedChange={(checked) =>
                      handleVideoChange('recordScreenShare', checked === true)
                    }
                    disabled={disabled}
                  />
                  <span className="text-sm">Record screen shares</span>
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="videoQuality" className="text-sm">
                  Video Quality
                </Label>
                <Select
                  value={value.video.quality}
                  onValueChange={(v) =>
                    handleQualityChange(v as RecordingConfig['video']['quality'])
                  }
                  disabled={disabled || !value.video.recordVideo}
                >
                  <SelectTrigger id="videoQuality" className="w-full">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low', 'medium', 'high'] as const).map((q) => (
                      <SelectItem key={q} value={q}>
                        {qualityLabels[q]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

RecordingConfigPanel.displayName = 'RecordingConfigPanel';
