/**
 * ComplianceTimeline Component
 *
 * Visual timeline of compliance violations during a session.
 */

import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ComplianceViolation, ViolationSeverity } from '../types/compliance.types';

export interface ComplianceTimelineProps {
  /** Violations to display on timeline */
  violations: ComplianceViolation[];
  /** Session start time (ISO string) */
  sessionStartTime?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Get color for severity
 */
function getSeverityColor(severity: ViolationSeverity) {
  const colors: Record<ViolationSeverity, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    info: 'bg-gray-400',
  };
  return colors[severity];
}

/**
 * Get icon for severity
 */
function getSeverityIcon(severity: ViolationSeverity) {
  if (severity === 'critical' || severity === 'high') {
    return AlertTriangle;
  }
  if (severity === 'medium') {
    return AlertCircle;
  }
  return Info;
}

/**
 * Timeline marker for a single violation
 */
function TimelineMarker({
  violation,
  position,
}: {
  violation: ComplianceViolation;
  position: number;
}) {
  const Icon = getSeverityIcon(violation.severity);
  const color = getSeverityColor(violation.severity);

  const time = useMemo(() => {
    return new Date(violation.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [violation.timestamp]);

  return (
    <div
      className="absolute -translate-x-1/2 group"
      style={{ left: `${position}%` }}
    >
      {/* Marker dot */}
      <div
        className={cn(
          'w-3 h-3 rounded-full border-2 border-background cursor-pointer transition-transform hover:scale-125',
          color
        )}
        title={`${violation.type.replace(/_/g, ' ')} - ${time}`}
      />

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-2 whitespace-nowrap text-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className="h-3 w-3" />
            <span className="font-medium capitalize">
              {violation.type.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">{time}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Summary bar showing violation density
 */
function SeveritySummary({ violations }: { violations: ComplianceViolation[] }) {
  const counts = useMemo(() => {
    const result: Record<ViolationSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    violations.forEach((v) => {
      result[v.severity]++;
    });
    return result;
  }, [violations]);

  const severities: ViolationSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="flex items-center gap-3 text-xs">
      {severities.map((severity) => {
        if (counts[severity] === 0) return null;
        return (
          <div key={severity} className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', getSeverityColor(severity))} />
            <span className="capitalize text-muted-foreground">
              {severity}: {counts[severity]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compliance timeline visualization
 *
 * @example
 * ```tsx
 * <ComplianceTimeline
 *   violations={violations}
 *   sessionStartTime={session.startTime}
 * />
 * ```
 */
export function ComplianceTimeline({
  violations,
  sessionStartTime,
  className,
}: ComplianceTimelineProps) {
  // Calculate positions based on time
  const markersWithPosition = useMemo(() => {
    if (violations.length === 0) return [];

    const times = violations.map((v) => new Date(v.timestamp).getTime());
    const startTime = sessionStartTime
      ? new Date(sessionStartTime).getTime()
      : Math.min(...times);
    const endTime = Math.max(...times);
    const duration = endTime - startTime || 1;

    return violations.map((violation) => {
      const time = new Date(violation.timestamp).getTime();
      const position = ((time - startTime) / duration) * 100;
      return { violation, position: Math.min(Math.max(position, 2), 98) };
    });
  }, [violations, sessionStartTime]);

  if (violations.length === 0) {
    return (
      <div className={cn('text-center py-4', className)}>
        <p className="text-sm text-muted-foreground">No violations to display</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      <SeveritySummary violations={violations} />

      {/* Timeline bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 bg-muted rounded-full" />

        {/* Markers */}
        <div className="absolute inset-0 flex items-center">
          {markersWithPosition.map(({ violation, position }) => (
            <TimelineMarker
              key={violation.id}
              violation={violation}
              position={position}
            />
          ))}
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {sessionStartTime
            ? new Date(sessionStartTime).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Start'}
        </span>
        <span>Now</span>
      </div>
    </div>
  );
}
