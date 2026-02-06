/**
 * Combobox Component
 *
 * Searchable select with support for single/multi-select and async loading.
 */

import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react';
import { Button } from '../button';
import { Badge } from '../badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../primitives/popover';
import { cn } from '../../utils';

// ============================================================================
// Types
// ============================================================================

export interface ComboboxOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional description */
  description?: string;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Custom data */
  data?: unknown;
}

export interface ComboboxProps {
  /** Available options */
  options: ComboboxOption[];
  /** Selected value (single mode) */
  value?: string;
  /** Selected values (multi mode) */
  values?: string[];
  /** Called when selection changes (single mode) */
  onChange?: (value: string | undefined) => void;
  /** Called when selection changes (multi mode) */
  onChangeMultiple?: (values: string[]) => void;
  /** Called when search term changes */
  onSearch?: (search: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state text */
  emptyText?: string;
  /** Whether multiple selection is allowed */
  multiple?: boolean;
  /** Whether the combobox is loading */
  isLoading?: boolean;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Whether to allow clearing selection */
  clearable?: boolean;
  /** Maximum number of items to display in multi-mode */
  maxDisplayItems?: number;
  /** Additional class name */
  className?: string;
  /** Trigger button class name */
  triggerClassName?: string;
  /** Popover content class name */
  contentClassName?: string;
}

// ============================================================================
// Component
// ============================================================================

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      values = [],
      onChange,
      onChangeMultiple,
      onSearch,
      placeholder = 'Select...',
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      multiple = false,
      isLoading = false,
      disabled = false,
      clearable = true,
      maxDisplayItems = 3,
      className,
      triggerClassName,
      contentClassName,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    // Get selected options for display
    const selectedOptions = useMemo(() => {
      if (multiple) {
        return options.filter((opt) => values.includes(opt.value));
      }
      return value ? options.filter((opt) => opt.value === value) : [];
    }, [multiple, options, value, values]);

    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const newValues = values.includes(optionValue)
            ? values.filter((v) => v !== optionValue)
            : [...values, optionValue];
          onChangeMultiple?.(newValues);
        } else {
          onChange?.(optionValue === value ? undefined : optionValue);
          setIsOpen(false);
        }
      },
      [multiple, value, values, onChange, onChangeMultiple]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
          onChangeMultiple?.([]);
        } else {
          onChange?.(undefined);
        }
      },
      [multiple, onChange, onChangeMultiple]
    );

    const handleRemoveValue = useCallback(
      (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (multiple) {
          onChangeMultiple?.(values.filter((v) => v !== optionValue));
        }
      },
      [multiple, values, onChangeMultiple]
    );

    const handleSearchChange = useCallback(
      (search: string) => {
        setSearchValue(search);
        onSearch?.(search);
      },
      [onSearch]
    );

    // Display value for trigger button
    const displayValue = useMemo(() => {
      if (selectedOptions.length === 0) {
        return placeholder;
      }

      if (multiple) {
        if (selectedOptions.length <= maxDisplayItems) {
          return (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveValue(opt.value, e)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Remove ${opt.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          );
        }
        return `${selectedOptions.length} selected`;
      }

      return selectedOptions[0]?.label;
    }, [selectedOptions, multiple, maxDisplayItems, placeholder, handleRemoveValue]);

    const hasValue = selectedOptions.length > 0;

    return (
      <div className={cn('relative', className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              disabled={disabled}
              className={cn(
                'w-full justify-between',
                !hasValue && 'text-muted-foreground',
                triggerClassName
              )}
            >
              <span className="flex-1 truncate text-left">
                {typeof displayValue === 'string' ? displayValue : displayValue}
              </span>
              <div className="flex items-center gap-1">
                {clearable && hasValue && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded p-0.5 hover:bg-muted"
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn('w-[--radix-popover-trigger-width] p-0', contentClassName)}
            align="start"
          >
            <Command>
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={handleSearchChange}
              />
              <CommandList>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => {
                        const isSelected = multiple
                          ? values.includes(option.value)
                          : option.value === value;

                        return (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            onSelect={() => handleSelect(option.value)}
                            className="gap-2"
                          >
                            <div
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50 [&_svg]:invisible'
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            {option.icon && (
                              <span className="text-muted-foreground">
                                {option.icon}
                              </span>
                            )}
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.description && (
                                <span className="text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
Combobox.displayName = 'Combobox';
