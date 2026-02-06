/**
 * LimitsDisplay Component
 * Displays tenant limits (read-only).
 */

import { Label } from '@/shared/ui';
import type { TenantLimits } from '../types/tenant-settings.types';

interface LimitsDisplayProps {
  limits: TenantLimits;
}

export function LimitsDisplay({ limits }: LimitsDisplayProps) {
  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const limitItems = [
    {
      label: 'Max Concurrent Sessions',
      value: formatNumber(limits.maxConcurrentSessions),
      description: 'Maximum number of sessions that can run simultaneously',
    },
    {
      label: 'Max Participants per Session',
      value: formatNumber(limits.maxParticipantsPerSession),
      description: 'Maximum participants allowed in a single session',
    },
    {
      label: 'Recording Minutes / Month',
      value: formatNumber(limits.maxRecordingMinutesPerMonth),
      description: 'Monthly recording quota',
    },
    {
      label: 'AI Minutes / Month',
      value: formatNumber(limits.maxAiMinutesPerMonth),
      description: 'Monthly AI processing quota',
    },
    {
      label: 'Storage',
      value: `${formatNumber(limits.maxStorageGb)} GB`,
      description: 'Total storage capacity',
    },
    {
      label: 'Data Retention',
      value: `${formatNumber(limits.retentionDays)} days`,
      description: 'How long data is retained',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These limits are defined by your subscription plan. Contact support to upgrade.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {limitItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border p-4 space-y-1"
          >
            <Label className="text-muted-foreground">{item.label}</Label>
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
