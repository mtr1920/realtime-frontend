/**
 * DateRangePicker Component
 *
 * A date range picker with two-month calendar view.
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
import { Calendar, type DateRange } from './Calendar';

// ============================================================================
// Types
// ============================================================================

export interface DateRangePickerProps {
  /** Selected date range */
  value?: DateRange | undefined;
  /** Called when date range changes */
  onChange?: (range: DateRange | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Date format string */
  dateFormat?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled dates */
  disabledDates?: Date[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Number of months to show */
  numberOfMonths?: number;
  /** Additional class name */
  className?: string;
  /** Trigger button class name */
  triggerClassName?: string;
}

// ============================================================================
// Component
// ============================================================================

export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Select date range',
      dateFormat = 'MMM d, yyyy',
      minDate,
      maxDate,
      disabledDates,
      disabled,
      numberOfMonths = 2,
      className,
      triggerClassName,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectRange = useCallback(
      (range: DateRange | undefined) => {
        onChange?.(range);
        // Close when range is complete
        if (range?.from && range?.to) {
          setIsOpen(false);
        }
      },
      [onChange]
    );

    const displayValue = (() => {
      if (!value?.from) return null;
      if (!value.to) return format(value.from, dateFormat);
      return `${format(value.from, dateFormat)} - ${format(value.to, dateFormat)}`;
    })();

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
                !value?.from && 'text-muted-foreground',
                triggerClassName
              )}
              aria-label={displayValue ?? placeholder ?? undefined}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {displayValue ?? placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selectedRange={value}
              onSelectRange={handleSelectRange}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              numberOfMonths={numberOfMonths}
              defaultMonth={value?.from}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';
