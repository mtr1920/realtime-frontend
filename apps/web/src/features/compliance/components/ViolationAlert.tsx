/**
 * ViolationAlert Component
 *
 * Displays a single compliance violation with severity-based styling,
 * auto-dismiss, and accessible dismiss functionality.
 */

import { useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, Info, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui';
import type { ComplianceViolation, ViolationSeverity } from '../types/compliance.types';
import { getDismissDelay } from '../stores/compliance.store';

// =============================================================================
// Types
// =============================================================================

export interface ViolationAlertProps {
  /** The violation to display */
  violation: ComplianceViolation;
  /** Callback when the alert is dismissed */
  onDismiss: (id: string) => void;
  /** Whether reduced motion is preferred */
  reduceMotion?: boolean;
  /** Optional class name */
  className?: string;
}

// =============================================================================
// Severity Configuration
// =============================================================================

interface SeverityConfig {
  icon: typeof AlertTriangle;
  containerClass: string;
  iconClass: string;
  titleClass: string;
}

const SEVERITY_CONFIG: Record<ViolationSeverity, SeverityConfig> = {
  critical: {
    icon: ShieldAlert,
    containerClass: 'bg-red-50 border-red-600 dark:bg-red-950/50 dark:border-red-500',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-800 dark:text-red-200',
  },
  high: {
    icon: AlertTriangle,
    containerClass: 'bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-400',
    iconClass: 'text-red-500 dark:text-red-400',
    titleClass: 'text-red-700 dark:text-red-200',
  },
  medium: {
    icon: AlertTriangle,
    containerClass: 'bg-amber-50 border-amber-500 dark:bg-amber-950/40 dark:border-amber-400',
    iconClass: 'text-amber-500 dark:text-amber-400',
    titleClass: 'text-amber-700 dark:text-amber-200',
  },
  low: {
    icon: AlertCircle,
    containerClass: 'bg-blue-50 border-blue-500 dark:bg-blue-950/40 dark:border-blue-400',
    iconClass: 'text-blue-500 dark:text-blue-400',
    titleClass: 'text-blue-700 dark:text-blue-200',
  },
  info: {
    icon: Info,
    containerClass: 'bg-blue-50 border-blue-400 dark:bg-blue-950/30 dark:border-blue-500',
    iconClass: 'text-blue-400 dark:text-blue-300',
    titleClass: 'text-blue-600 dark:text-blue-200',
  },
};

const SEVERITY_LABELS: Record<ViolationSeverity, string> = {
  critical: 'Critical Violation',
  high: 'High Priority',
  medium: 'Warning',
  low: 'Notice',
  info: 'Information',
};

// =============================================================================
// Component
// =============================================================================

export function ViolationAlert({
  violation,
  onDismiss,
  reduceMotion = false,
  className,
}: ViolationAlertProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = SEVERITY_CONFIG[violation.severity];
  const Icon = config.icon;
  const isCriticalOrHigh = violation.severity === 'critical' || violation.severity === 'high';

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onDismiss(violation.id);
  }, [violation.id, onDismiss]);

  // Setup auto-dismiss timer
  useEffect(() => {
    const delay = getDismissDelay(violation.severity);
    timerRef.current = setTimeout(handleDismiss, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [violation.severity, handleDismiss]);

  // Handle keyboard dismiss
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  return (
    <div
      role="alert"
      aria-live={isCriticalOrHigh ? 'assertive' : 'polite'}
      aria-atomic="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border-l-4 p-4 pr-10 shadow-lg',
        'min-w-[320px] max-w-[420px]',
        config.containerClass,
        !reduceMotion && 'animate-in slide-in-from-right-5 fade-in duration-200',
        className
      )}
    >
      {/* Icon */}
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClass)} aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold text-sm', config.titleClass)}>
            {SEVERITY_LABELS[violation.severity]}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/80 break-words">{violation.message}</p>
      </div>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
        onClick={handleDismiss}
        aria-label="Dismiss violation alert"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
