/**
 * ViolationFilters Component
 *
 * Filter controls for compliance violation history.
 */

import { useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { Button, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useComplianceHistoryStore, selectHasActiveFilter } from '../stores/compliance-history.store';
import type { ViolationSeverity, ViolationType } from '../types/compliance.types';

export interface ViolationFiltersProps {
  /** Additional class names */
  className?: string;
}

const SEVERITY_OPTIONS: { value: ViolationSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'info', label: 'Info', color: 'bg-gray-500' },
];

const TYPE_OPTIONS: { value: ViolationType; label: string }[] = [
  { value: 'tab_switch', label: 'Tab Switch' },
  { value: 'window_blur', label: 'Window Blur' },
  { value: 'copy_paste', label: 'Copy/Paste' },
  { value: 'keyboard_shortcut', label: 'Keyboard Shortcut' },
  { value: 'screen_capture_attempt', label: 'Screen Capture' },
  { value: 'multiple_faces', label: 'Multiple Faces' },
  { value: 'no_face', label: 'No Face' },
  { value: 'suspicious_audio', label: 'Suspicious Audio' },
];

/**
 * Filter controls for violation history
 *
 * @example
 * ```tsx
 * <ViolationFilters />
 * ```
 */
export function ViolationFilters({ className }: ViolationFiltersProps) {
  const filter = useComplianceHistoryStore((state) => state.filter);
  const setFilter = useComplianceHistoryStore((state) => state.setFilter);
  const resetFilter = useComplianceHistoryStore((state) => state.resetFilter);
  const hasActiveFilter = useComplianceHistoryStore(selectHasActiveFilter);

  const toggleSeverity = useCallback(
    (severity: ViolationSeverity) => {
      const current = filter.severities;
      const newSeverities = current.includes(severity)
        ? current.filter((s) => s !== severity)
        : [...current, severity];
      setFilter({ severities: newSeverities });
    },
    [filter.severities, setFilter]
  );

  const toggleType = useCallback(
    (type: ViolationType) => {
      const current = filter.types;
      const newTypes = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      setFilter({ types: newTypes });
    },
    [filter.types, setFilter]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Severity Filters */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Severity</p>
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filter.severities.includes(option.value) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                filter.severities.includes(option.value) && option.color
              )}
              onClick={() => toggleSeverity(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Type</p>
        <div className="flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={filter.types.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleType(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
