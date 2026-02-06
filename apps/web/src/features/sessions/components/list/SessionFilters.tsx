/**
 * Session Filters
 * Filter controls for sessions list.
 */

import { Search, X } from 'lucide-react';
import type { SessionStatus } from '../../api/sessions.service';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

const statusOptions: Array<{ value: SessionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'CREATED', label: 'Created' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'FAILED', label: 'Failed' },
];

interface SessionFiltersProps {
  search: string;
  status: SessionStatus | undefined;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: SessionStatus | undefined) => void;
  onClear: () => void;
}

export function SessionFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClear,
}: SessionFiltersProps) {
  const hasFilters = search || status;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={status ?? 'all'}
        onValueChange={(value) =>
          onStatusChange(value === 'all' ? undefined : (value as SessionStatus))
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">Clear filters</span>
        </Button>
      )}
    </div>
  );
}
