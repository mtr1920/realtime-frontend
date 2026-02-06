/**
 * TableToolbar Component
 *
 * Search and filter controls for the DataTable.
 */

import { Search, X } from 'lucide-react';
import { Input } from '../../input';
import { Button } from '../../button';
import {
  toolbarVariants,
  toolbarLeftVariants,
  toolbarRightVariants,
} from '../variants';
import { cn } from '../../../utils';

export interface TableToolbarProps {
  /** Global search value */
  searchValue?: string;
  /** Search value change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Whether search is enabled */
  enableSearch?: boolean;
  /** Left side content (before search) */
  leftContent?: React.ReactNode;
  /** Right side content (after search) */
  rightContent?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function TableToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  enableSearch = true,
  leftContent,
  rightContent,
  className,
}: TableToolbarProps) {
  const handleClear = () => {
    onSearchChange?.('');
  };

  return (
    <div className={cn(toolbarVariants(), className)}>
      <div className={toolbarLeftVariants()}>
        {leftContent}
        {enableSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 pr-8 w-64"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className={toolbarRightVariants()}>
        {rightContent}
      </div>
    </div>
  );
}
