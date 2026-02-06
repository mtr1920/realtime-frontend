/**
 * DateRangeFilter Component
 * Select component for filtering dashboard data by time period.
 */

import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { getPeriodLabel } from '../api/dashboard.service';
import type { DateRangePeriod } from '../types/dashboard.types';

// =============================================================================
// Types
// =============================================================================

export interface DateRangeFilterProps {
  /** Currently selected period */
  value: DateRangePeriod;
  /** Callback when period changes */
  onChange: (period: DateRangePeriod) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PERIOD_OPTIONS: DateRangePeriod[] = [
  'today',
  'yesterday',
  'last7days',
  'last30days',
  'thisMonth',
  'lastMonth',
];

// =============================================================================
// Component
// =============================================================================

export function DateRangeFilter({
  value,
  onChange,
  disabled,
  className,
}: DateRangeFilterProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      <Select
        value={value}
        onValueChange={(val) => onChange(val as DateRangePeriod)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[160px]" aria-label="Select time period">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((period) => (
            <SelectItem key={period} value={period}>
              {getPeriodLabel(period)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
