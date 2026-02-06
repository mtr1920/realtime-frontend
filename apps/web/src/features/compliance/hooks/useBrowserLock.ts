/**
 * useBrowserLock Hook
 *
 * Detects browser tab switches, window blur, and visibility changes
 * and reports violations to the server when browser lock is enabled.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSend } from '@/features/realtime';
import type { ViolationType, ViolationSeverity } from '../types/compliance.types';

export interface UseBrowserLockOptions {
  /** Whether browser lock monitoring is enabled */
  enabled: boolean;
}

export interface UseBrowserLockResult {
  /** Manually report a violation */
  reportViolation: (
    type: ViolationType,
    severity: ViolationSeverity,
    message: string,
    details?: Record<string, unknown>
  ) => void;
}

/**
 * Hook for browser lock detection and violation reporting
 *
 * @example
 * ```tsx
 * const { isBrowserLockRequired } = useSessionConfig();
 * useBrowserLock({ enabled: isBrowserLockRequired });
 * ```
 */
export function useBrowserLock({ enabled }: UseBrowserLockOptions): UseBrowserLockResult {
  const send = useSend();
  const lastViolationTimeRef = useRef<number>(0);

  // Debounce threshold to prevent rapid-fire violations (500ms)
  const DEBOUNCE_MS = 500;

  const reportViolation = useCallback(
    (
      type: ViolationType,
      severity: ViolationSeverity,
      _message: string,
      details?: Record<string, unknown>
    ) => {
      const now = Date.now();

      // Debounce rapid violations of the same type
      if (now - lastViolationTimeRef.current < DEBOUNCE_MS) {
        return;
      }
      lastViolationTimeRef.current = now;

      // Backend expects flat structure (no nested 'violation' object, no 'message' field)
      send('compliance.violation', {
        type,
        severity,
        details,
        timestamp: new Date().toISOString(),
      });
    },
    [send]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation(
          'tab_switch',
          'medium',
          'Tab switched or minimized',
          { visibilityState: document.visibilityState }
        );
      }
    };

    // Handle window blur (clicking outside the browser window)
    const handleWindowBlur = () => {
      // Only report if the document is not hidden (to avoid duplicate with visibility change)
      if (!document.hidden) {
        reportViolation(
          'window_blur',
          'low',
          'Window lost focus',
          { timestamp: Date.now() }
        );
      }
    };

    // Handle beforeunload (attempt to leave page)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      reportViolation(
        'tab_switch',
        'high',
        'Attempted to leave session page',
        { type: 'beforeunload' }
      );
      // Standard way to trigger browser confirmation dialog
      event.preventDefault();
      event.returnValue = '';
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, reportViolation]);

  return { reportViolation };
}
