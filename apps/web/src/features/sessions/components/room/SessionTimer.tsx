/**
 * SessionTimer
 *
 * Displays session duration or countdown timer.
 */

import { useState, useEffect, useMemo } from 'react';
import { Clock, Timer } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface SessionTimerProps {
  /** Session start time (ISO string) */
  startTime?: string | null;

  /** Session scheduled end time for countdown (ISO string) */
  endTime?: string | null;

  /** Timer mode */
  mode?: 'elapsed' | 'countdown' | 'auto';

  /** Show icon */
  showIcon?: boolean;

  /** Additional CSS class */
  className?: string;
}

export function SessionTimer({
  startTime,
  endTime,
  mode = 'auto',
  showIcon = true,
  className,
}: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate times
  const { display, isCountdown, isWarning, isDanger } = useMemo(() => {
    const actualMode =
      mode === 'auto' ? (endTime ? 'countdown' : 'elapsed') : mode;

    if (actualMode === 'countdown' && endTime) {
      const remaining = new Date(endTime).getTime() - now;

      if (remaining <= 0) {
        return { display: '00:00', isCountdown: true, isWarning: false, isDanger: true };
      }

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      let formatted: string;
      if (hours > 0) {
        formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      // Warning at 5 minutes, danger at 1 minute
      const isWarning = remaining <= 5 * 60 * 1000 && remaining > 60 * 1000;
      const isDanger = remaining <= 60 * 1000;

      return { display: formatted, isCountdown: true, isWarning, isDanger };
    } else if (startTime) {
      const elapsed = now - new Date(startTime).getTime();

      if (elapsed < 0) {
        return { display: '00:00', isCountdown: false, isWarning: false, isDanger: false };
      }

      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      let formatted: string;
      if (hours > 0) {
        formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      return { display: formatted, isCountdown: false, isWarning: false, isDanger: false };
    }

    return { display: '--:--', isCountdown: false, isWarning: false, isDanger: false };
  }, [now, startTime, endTime, mode]);

  const Icon = isCountdown ? Timer : Clock;

  return (
    <div
      className={cn(
        'flex items-center gap-2 font-mono text-sm',
        isDanger && 'text-red-600 dark:text-red-400',
        isWarning && !isDanger && 'text-amber-600 dark:text-amber-400',
        className
      )}
      aria-live={isDanger || isWarning ? 'polite' : 'off'}
      aria-label={isCountdown ? `${display} remaining` : `${display} elapsed`}
    >
      {showIcon && (
        <Icon
          className={cn(
            'h-4 w-4',
            (isDanger || isWarning) && 'motion-safe:animate-pulse'
          )}
          aria-hidden
        />
      )}
      <span className={cn((isDanger || isWarning) && 'font-bold')}>
        {display}
      </span>
    </div>
  );
}
