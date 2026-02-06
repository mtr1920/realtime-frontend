/**
 * DatePicker Component
 *
 * A date picker with popover and optional time selection.
 */

import { forwardRef, useCallback, useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '../button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../primitives/popover';
import { cn } from '../../utils';
import { Calendar } from './Calendar';
import { TimeInput } from './TimeInput';

// ============================================================================
// Types
// ============================================================================

export interface DatePickerProps {
  /** Selected date */
  value?: Date | undefined;
  /** Called when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Date format string */
  dateFormat?: string;
  /** Include time selection */
  includeTime?: boolean;
  /** Time format (12 or 24 hour) */
  timeFormat?: '12' | '24';
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
  /** Trigger button class name */
  triggerClassName?: string;
}

// ============================================================================
// Component
// ============================================================================

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Select date',
      dateFormat = 'PPP',
      includeTime = false,
      timeFormat = '12',
      minDate,
      maxDate,
      disabledDates,
      disabled,
      className,
      triggerClassName,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = useCallback(
      (date: Date | undefined) => {
        if (date && value && includeTime) {
          // Preserve time from existing value
          date.setHours(value.getHours());
          date.setMinutes(value.getMinutes());
        }
        onChange?.(date);
        if (!includeTime) {
          setIsOpen(false);
        }
      },
      [value, includeTime, onChange]
    );

    const handleTimeChange = useCallback(
      (hours: number, minutes: number) => {
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        onChange?.(newDate);
      },
      [value, onChange]
    );

    const displayValue = value
      ? includeTime
        ? `${format(value, dateFormat)} ${format(value, timeFormat === '12' ? 'h:mm a' : 'HH:mm')}`
        : format(value, dateFormat)
      : null;

    return (
      <div className={cn('relative', className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground',
                triggerClassName
              )}
              aria-label={value ? displayValue ?? undefined : placeholder}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {displayValue ?? placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              defaultMonth={value}
            />
            {includeTime && (
              <div className="border-t p-3">
                <TimeInput
                  value={value}
                  onChange={handleTimeChange}
                  format={timeFormat}
                />
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
DatePicker.displayName = 'DatePicker';
