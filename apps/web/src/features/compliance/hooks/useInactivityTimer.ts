/**
 * useInactivityTimer Hook
 *
 * Detects user inactivity and triggers warnings/callbacks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseInactivityTimerOptions {
  /** Whether the timer is enabled */
  enabled?: boolean;
  /** Time until warning (in seconds) */
  warningTimeoutSeconds?: number;
  /** Time until inactive after warning (in seconds) */
  inactiveTimeoutSeconds?: number;
  /** Callback when warning should show */
  onWarning?: () => void;
  /** Callback when user becomes inactive */
  onInactive?: () => void;
  /** Callback when activity is detected */
  onActivity?: () => void;
}

export interface UseInactivityTimerResult {
  /** Whether the warning is currently showing */
  isWarningActive: boolean;
  /** Seconds remaining until inactive */
  secondsRemaining: number;
  /** Reset the timer (call when user takes action) */
  resetTimer: () => void;
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'keypress',
  'touchstart',
  'scroll',
  'wheel',
] as const;

/**
 * Hook for detecting user inactivity
 *
 * @example
 * ```tsx
 * const { isWarningActive, secondsRemaining, resetTimer } = useInactivityTimer({
 *   enabled: true,
 *   warningTimeoutSeconds: 60,
 *   inactiveTimeoutSeconds: 30,
 *   onWarning: () => console.log('Warning!'),
 *   onInactive: () => console.log('User is inactive'),
 * });
 * ```
 */
export function useInactivityTimer({
  enabled = true,
  warningTimeoutSeconds = 60,
  inactiveTimeoutSeconds = 30,
  onWarning,
  onInactive,
  onActivity,
}: UseInactivityTimerOptions = {}): UseInactivityTimerResult {
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(inactiveTimeoutSeconds);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Start the countdown after warning
  const startCountdown = useCallback(() => {
    setSecondsRemaining(inactiveTimeoutSeconds);

    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTimers();
          setIsWarningActive(false);
          onInactive?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [inactiveTimeoutSeconds, onInactive, clearTimers]);

  // Start the warning timer
  const startWarningTimer = useCallback(() => {
    clearTimers();
    setIsWarningActive(false);

    warningTimerRef.current = setTimeout(() => {
      setIsWarningActive(true);
      onWarning?.();
      startCountdown();
    }, warningTimeoutSeconds * 1000);
  }, [warningTimeoutSeconds, onWarning, startCountdown, clearTimers]);

  // Reset timer when activity detected
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarningActive(false);
    setSecondsRemaining(inactiveTimeoutSeconds);
    onActivity?.();
    startWarningTimer();
  }, [inactiveTimeoutSeconds, onActivity, startWarningTimer]);

  // Handle activity events
  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Throttle activity detection to prevent excessive resets
    if (now - lastActivityRef.current > 1000) {
      resetTimer();
    }
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setIsWarningActive(false);
      return;
    }

    // Start initial timer
    startWarningTimer();

    // Add event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, startWarningTimer, handleActivity, clearTimers]);

  return {
    isWarningActive,
    secondsRemaining,
    resetTimer,
  };
}
