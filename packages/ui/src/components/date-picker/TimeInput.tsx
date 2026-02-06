/**
 * TimeInput Component
 *
 * Time input with hour, minute, and AM/PM selection.
 */

import { forwardRef, useCallback, useMemo } from 'react';
import { Input } from '../input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface TimeInputProps {
  /** Current time value */
  value?: Date;
  /** Called when time changes */
  onChange?: (hours: number, minutes: number) => void;
  /** Time format (12 or 24 hour) */
  format?: '12' | '24';
  /** Step for minutes (default: 1) */
  minuteStep?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(
  (
    {
      value,
      onChange,
      format = '12',
      minuteStep = 1,
      disabled,
      className,
    },
    ref
  ) => {
    const hours24 = value?.getHours() ?? 12;
    const minutes = value?.getMinutes() ?? 0;

    const { displayHours, period } = useMemo(() => {
      if (format === '24') {
        return { displayHours: hours24, period: undefined };
      }
      const isPM = hours24 >= 12;
      const h = hours24 % 12 || 12;
      return { displayHours: h, period: isPM ? 'PM' : 'AM' };
    }, [hours24, format]);

    const handleHoursChange = useCallback(
      (newHours: string) => {
        const h = parseInt(newHours, 10);
        if (isNaN(h)) return;

        let hours24Value: number;
        if (format === '24') {
          hours24Value = Math.min(23, Math.max(0, h));
        } else {
          // Convert 12-hour to 24-hour
          const isPM = period === 'PM';
          if (h === 12) {
            hours24Value = isPM ? 12 : 0;
          } else {
            hours24Value = isPM ? h + 12 : h;
          }
        }
        onChange?.(hours24Value, minutes);
      },
      [format, period, minutes, onChange]
    );

    const handleMinutesChange = useCallback(
      (newMinutes: string) => {
        const m = parseInt(newMinutes, 10);
        if (isNaN(m)) return;
        const clampedMinutes = Math.min(59, Math.max(0, m));
        onChange?.(hours24, clampedMinutes);
      },
      [hours24, onChange]
    );

    const handlePeriodChange = useCallback(
      (newPeriod: string) => {
        if (format !== '12') return;

        const currentHour12 = hours24 % 12 || 12;
        let newHours24: number;

        if (newPeriod === 'PM') {
          newHours24 = currentHour12 === 12 ? 12 : currentHour12 + 12;
        } else {
          newHours24 = currentHour12 === 12 ? 0 : currentHour12;
        }

        onChange?.(newHours24, minutes);
      },
      [format, hours24, minutes, onChange]
    );

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={displayHours.toString().padStart(2, '0')}
            onChange={(e) => handleHoursChange(e.target.value)}
            min={format === '24' ? 0 : 1}
            max={format === '24' ? 23 : 12}
            disabled={disabled}
            className="h-8 w-14 text-center"
            aria-label="Hours"
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            value={minutes.toString().padStart(2, '0')}
            onChange={(e) => handleMinutesChange(e.target.value)}
            min={0}
            max={59}
            step={minuteStep}
            disabled={disabled}
            className="h-8 w-14 text-center"
            aria-label="Minutes"
          />
        </div>

        {format === '12' && (
          <Select value={period} onValueChange={handlePeriodChange} disabled={disabled}>
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }
);
TimeInput.displayName = 'TimeInput';
