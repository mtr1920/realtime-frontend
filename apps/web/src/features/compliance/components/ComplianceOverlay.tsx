/**
 * ComplianceOverlay Component
 *
 * Container for displaying compliance violations in the session room.
 * Subscribes to compliance.violation messages and manages the violation queue.
 * Positions alerts based on severity and respects reduced motion preferences.
 */

import { useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { useSubscription } from '@/features/realtime';
import { useReducedMotion } from '@/shared/theme/useReducedMotion';
import { useComplianceStore } from '../stores/compliance.store';
import { ViolationAlert } from './ViolationAlert';

// =============================================================================
// Types
// =============================================================================

export interface ComplianceOverlayProps {
  /** Optional class name for the container */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ComplianceOverlay({ className }: ComplianceOverlayProps) {
  const reduceMotion = useReducedMotion();
  const addViolation = useComplianceStore((state) => state.addViolation);
  const dismissViolation = useComplianceStore((state) => state.dismissViolation);
  const getVisibleViolations = useComplianceStore((state) => state.getVisibleViolations);
  const queuedCount = useComplianceStore((state) => state.getQueuedCount());

  const visibleViolations = getVisibleViolations();

  // Subscribe to compliance violation messages
  useSubscription('compliance.violation', (payload) => {
    addViolation(payload.violation);
  });

  // Handle dismiss
  const handleDismiss = useCallback(
    (id: string) => {
      dismissViolation(id);
    },
    [dismissViolation]
  );

  // Don't render if no violations
  if (visibleViolations.length === 0) {
    return null;
  }

  // Check if any critical violations (position at top-center for critical)
  const hasCritical = visibleViolations.some((v) => v.severity === 'critical');

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3 pointer-events-none',
        hasCritical
          ? 'top-4 left-1/2 -translate-x-1/2 items-center'
          : 'bottom-4 right-4 items-end',
        className
      )}
      aria-label="Compliance violation alerts"
      role="region"
    >
      {/* Violations list */}
      {visibleViolations.map((violation) => (
        <div key={violation.id} className="pointer-events-auto">
          <ViolationAlert
            violation={violation}
            onDismiss={handleDismiss}
            reduceMotion={reduceMotion}
          />
        </div>
      ))}

      {/* Queued indicator */}
      {queuedCount > 0 && (
        <div
          className={cn(
            'pointer-events-auto text-xs text-muted-foreground',
            'bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm border'
          )}
          aria-live="polite"
        >
          +{queuedCount} more {queuedCount === 1 ? 'alert' : 'alerts'}
        </div>
      )}
    </div>
  );
}
