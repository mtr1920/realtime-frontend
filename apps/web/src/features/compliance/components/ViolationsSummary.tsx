/**
 * ViolationsSummary Component
 *
 * Aggregated summary of violations by type and severity.
 */

import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { ComplianceViolation, ViolationSeverity, ViolationType } from '../types/compliance.types';

export interface ViolationsSummaryProps {
  /** Violations to summarize */
  violations: ComplianceViolation[];
  /** Additional class names */
  className?: string;
}

const SEVERITY_CONFIG: Record<ViolationSeverity, { label: string; color: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', icon: AlertCircle },
  low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400', icon: Info },
  info: { label: 'Info', color: 'text-gray-600 dark:text-gray-400', icon: Info },
};

const TYPE_LABELS: Partial<Record<ViolationType, string>> = {
  tab_switch: 'Tab Switch',
  window_blur: 'Window Blur',
  copy_paste: 'Copy/Paste',
  keyboard_shortcut: 'Keyboard Shortcut',
  screen_capture_attempt: 'Screen Capture',
  multiple_faces: 'Multiple Faces',
  no_face: 'No Face',
  suspicious_audio: 'Suspicious Audio',
  custom: 'Other',
};

/**
 * Summary of violations by severity and type
 *
 * @example
 * ```tsx
 * <ViolationsSummary violations={sessionViolations} />
 * ```
 */
export function ViolationsSummary({ violations, className }: ViolationsSummaryProps) {
  const { bySeverity, byType, total } = useMemo(() => {
    const severityCounts: Record<ViolationSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const typeCounts: Partial<Record<ViolationType, number>> = {};

    violations.forEach((v) => {
      severityCounts[v.severity]++;
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });

    return {
      bySeverity: severityCounts,
      byType: typeCounts,
      total: violations.length,
    };
  }, [violations]);

  const sortedSeverities = (['critical', 'high', 'medium', 'low', 'info'] as ViolationSeverity[])
    .filter((s) => bySeverity[s] > 0);

  const sortedTypes = Object.entries(byType)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 5);

  if (total === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Info className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-sm font-medium text-green-600">No Violations</p>
          <p className="text-xs text-muted-foreground">Session completed without issues</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Violations Summary
          <Badge variant="secondary" className="ml-auto" aria-label={`${total} total violations`}>
            <span aria-hidden="true">{total} total</span>
            <span className="sr-only">{total} total violations</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* By Severity */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            By Severity
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedSeverities.map((severity) => {
              const config = SEVERITY_CONFIG[severity];
              const count = bySeverity[severity];
              const Icon = config.icon;
              return (
                <div
                  key={severity}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50',
                    config.color
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Type */}
        {sortedTypes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              By Type
            </p>
            <div className="space-y-1">
              {sortedTypes.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {TYPE_LABELS[type as ViolationType] || type}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
