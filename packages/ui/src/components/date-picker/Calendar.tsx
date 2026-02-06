/**
 * Calendar Component
 *
 * A calendar for date selection using date-fns.
 */

import { forwardRef, useCallback, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../button';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface CalendarProps {
  /** Selected date (single mode) */
  selected?: Date | undefined;
  /** Selected date range (range mode) */
  selectedRange?: DateRange | undefined;
  /** Mode: single date or range selection */
  mode?: 'single' | 'range';
  /** Called when a date is selected */
  onSelect?: (date: Date | undefined) => void;
  /** Called when a date range is selected */
  onSelectRange?: (range: DateRange | undefined) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Dates that are disabled */
  disabledDates?: Date[];
  /** Initial month to display */
  defaultMonth?: Date;
  /** Number of months to display */
  numberOfMonths?: number;
  /** Week starts on (0 = Sunday, 1 = Monday) */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      selected,
      selectedRange,
      mode = 'single',
      onSelect,
      onSelectRange,
      minDate,
      maxDate,
      disabledDates = [],
      defaultMonth,
      numberOfMonths = 1,
      weekStartsOn = 0,
      className,
    },
    ref
  ) => {
    const [currentMonth, setCurrentMonth] = useState(
      defaultMonth ?? selected ?? selectedRange?.from ?? new Date()
    );
    const [rangeStart, setRangeStart] = useState<Date | undefined>(
      selectedRange?.from
    );

    const weekDays = useMemo(() => {
      const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      return [...days.slice(weekStartsOn), ...days.slice(0, weekStartsOn)];
    }, [weekStartsOn]);

    const isDateDisabled = useCallback(
      (date: Date): boolean => {
        if (minDate && isBefore(date, minDate)) return true;
        if (maxDate && isAfter(date, maxDate)) return true;
        return disabledDates.some((d) => isSameDay(d, date));
      },
      [minDate, maxDate, disabledDates]
    );

    const isDateInRange = useCallback(
      (date: Date): boolean => {
        if (mode !== 'range' || !selectedRange?.from || !selectedRange?.to) {
          return false;
        }
        return isWithinInterval(date, {
          start: selectedRange.from,
          end: selectedRange.to,
        });
      },
      [mode, selectedRange]
    );

    const isRangeStart = useCallback(
      (date: Date): boolean => {
        return !!selectedRange?.from && isSameDay(date, selectedRange.from);
      },
      [selectedRange]
    );

    const isRangeEnd = useCallback(
      (date: Date): boolean => {
        return !!selectedRange?.to && isSameDay(date, selectedRange.to);
      },
      [selectedRange]
    );

    const handleDateClick = useCallback(
      (date: Date) => {
        if (isDateDisabled(date)) return;

        if (mode === 'single') {
          onSelect?.(date);
        } else {
          // Range mode
          if (!rangeStart || (rangeStart && selectedRange?.to)) {
            // Start a new range
            setRangeStart(date);
            onSelectRange?.({ from: date, to: undefined });
          } else {
            // Complete the range
            const from = isBefore(date, rangeStart) ? date : rangeStart;
            const to = isBefore(date, rangeStart) ? rangeStart : date;
            setRangeStart(undefined);
            onSelectRange?.({ from, to });
          }
        }
      },
      [mode, rangeStart, selectedRange, isDateDisabled, onSelect, onSelectRange]
    );

    const handlePrevMonth = useCallback(() => {
      setCurrentMonth((prev) => subMonths(prev, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
      setCurrentMonth((prev) => addMonths(prev, 1));
    }, []);

    // Generate calendar days for a month
    const generateMonthDays = useCallback(
      (month: Date) => {
        const start = startOfWeek(startOfMonth(month), { weekStartsOn });
        const end = endOfWeek(endOfMonth(month), { weekStartsOn });
        const days: Date[] = [];
        let day = start;

        while (day <= end) {
          days.push(day);
          day = addDays(day, 1);
        }

        return days;
      },
      [weekStartsOn]
    );

    // Generate months to display
    const months = useMemo(() => {
      return Array.from({ length: numberOfMonths }, (_, i) =>
        addMonths(currentMonth, i)
      );
    }, [currentMonth, numberOfMonths]);

    return (
      <div ref={ref} className={cn('p-3', className)}>
        <div className={cn('flex', numberOfMonths > 1 && 'gap-4')}>
          {months.map((month, monthIndex) => (
            <div key={month.toISOString()} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                {monthIndex === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                {monthIndex !== 0 && <div className="w-7" />}

                <span className="text-sm font-medium">
                  {format(month, 'MMMM yyyy')}
                </span>

                {monthIndex === numberOfMonths - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                {monthIndex !== numberOfMonths - 1 && <div className="w-7" />}
              </div>

              {/* Week days header */}
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-8 w-8 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {generateMonthDays(month).map((day) => {
                  const isCurrentMonth = isSameMonth(day, month);
                  const isSelected =
                    mode === 'single' && selected && isSameDay(day, selected);
                  const disabled = isDateDisabled(day);
                  const today = isToday(day);
                  const inRange = isDateInRange(day);
                  const rangeStartDay = isRangeStart(day);
                  const rangeEndDay = isRangeEnd(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      disabled={disabled}
                      className={cn(
                        'h-8 w-8 rounded-md text-sm transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        !isCurrentMonth && 'text-muted-foreground opacity-50',
                        today && 'border border-primary',
                        isSelected &&
                          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                        inRange &&
                          !rangeStartDay &&
                          !rangeEndDay &&
                          'bg-accent',
                        (rangeStartDay || rangeEndDay) &&
                          'bg-primary text-primary-foreground',
                        disabled &&
                          'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-inherit'
                      )}
                      aria-label={format(day, 'PPPP')}
                      aria-selected={isSelected || rangeStartDay || rangeEndDay}
                      aria-disabled={disabled}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';
