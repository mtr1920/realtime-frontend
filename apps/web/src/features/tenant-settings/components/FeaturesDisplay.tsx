/**
 * FeaturesDisplay Component
 * Displays enabled tenant features (read-only).
 */

import { Badge } from '@/shared/ui';
import type { TenantFeatures } from '../types/tenant-settings.types';

interface FeaturesDisplayProps {
  features: TenantFeatures;
}

const featureLabels: Record<keyof TenantFeatures, { label: string; description: string }> = {
  aiEnabled: {
    label: 'AI Features',
    description: 'AI-powered analysis, summaries, and recommendations',
  },
  complianceEnabled: {
    label: 'Compliance',
    description: 'Compliance monitoring and violation detection',
  },
  recordingEnabled: {
    label: 'Recording',
    description: 'Session recording capabilities',
  },
  transcriptionEnabled: {
    label: 'Transcription',
    description: 'Automatic speech-to-text transcription',
  },
  analyticsEnabled: {
    label: 'Analytics',
    description: 'Advanced analytics and reporting',
  },
  ssoEnabled: {
    label: 'SSO',
    description: 'Single sign-on authentication',
  },
  webhooksEnabled: {
    label: 'Webhooks',
    description: 'Webhook integrations for events',
  },
  customDomainsEnabled: {
    label: 'Custom Domains',
    description: 'Custom domain configuration',
  },
};

export function FeaturesDisplay({ features }: FeaturesDisplayProps) {
  const featureEntries = Object.entries(features) as [keyof TenantFeatures, boolean][];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Features available on your subscription plan. Contact support to enable additional features.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {featureEntries.map(([key, enabled]) => {
          const config = featureLabels[key];
          return (
            <div
              key={key}
              className={`rounded-lg border p-4 ${
                enabled ? 'border-border' : 'border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{config.label}</span>
                <Badge
                  variant={enabled ? 'success' : 'secondary'}
                  aria-label={`${config.label} is ${enabled ? 'enabled' : 'disabled'}`}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
