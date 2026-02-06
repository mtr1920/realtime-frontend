/**
 * ViolationList Component
 *
 * Displays a list of compliance violations with virtual scrolling support.
 */

import { useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Monitor,
  Eye,
  Keyboard,
  Copy,
  Camera,
  Users,
  UserX,
  Volume2,
} from 'lucide-react';
import { Badge, ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { ComplianceViolation, ViolationSeverity, ViolationType } from '../types/compliance.types';

export interface ViolationListProps {
  /** Violations to display */
  violations: ComplianceViolation[];
  /** Maximum height for scrollable area */
  maxHeight?: string;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Get icon for violation type
 */
function getViolationIcon(type: ViolationType) {
  const icons: Record<ViolationType, typeof AlertTriangle> = {
    tab_switch: Monitor,
    window_blur: Eye,
    copy_paste: Copy,
    keyboard_shortcut: Keyboard,
    screen_capture_attempt: Camera,
    multiple_faces: Users,
    no_face: UserX,
    suspicious_audio: Volume2,
    custom: AlertCircle,
  };
  return icons[type] || AlertCircle;
}

/**
 * Get severity icon and color
 */
function getSeverityConfig(severity: ViolationSeverity) {
  const configs: Record<ViolationSeverity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
    critical: {
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    },
    high: {
      icon: AlertTriangle,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
    },
    medium: {
      icon: AlertCircle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    },
    low: {
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    },
    info: {
      icon: Info,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    },
  };
  return configs[severity];
}

/**
 * Single violation item
 */
function ViolationItem({
  violation,
  showTimestamp = true,
}: {
  violation: ComplianceViolation;
  showTimestamp?: boolean;
}) {
  const TypeIcon = getViolationIcon(violation.type);
  const severityConfig = getSeverityConfig(violation.severity);

  const formattedTime = useMemo(() => {
    return new Date(violation.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [violation.timestamp]);

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-3 transition-colors hover:bg-muted/50',
        severityConfig.bg
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn('mt-0.5', severityConfig.color)}>
          <TypeIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs capitalize">
              {violation.type.replace(/_/g, ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs capitalize', severityConfig.color)}
            >
              {violation.severity}
            </Badge>
            {showTimestamp && (
              <span className="text-xs text-muted-foreground ml-auto">
                {formattedTime}
              </span>
            )}
          </div>

          <p className="text-sm text-foreground">{violation.message}</p>

          {/* Action taken */}
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Action: {violation.action}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Violation list with scrolling support
 *
 * @example
 * ```tsx
 * <ViolationList violations={violations} maxHeight="400px" />
 * ```
 */
export function ViolationList({
  violations,
  maxHeight = '400px',
  showTimestamps = true,
  className,
}: ViolationListProps) {
  if (violations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <Info className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No violations recorded</p>
      </div>
    );
  }

  return (
    <ScrollArea className={className} style={{ maxHeight }}>
      <div className="space-y-2 pr-4">
        {violations.map((violation) => (
          <ViolationItem
            key={violation.id}
            violation={violation}
            showTimestamp={showTimestamps}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
