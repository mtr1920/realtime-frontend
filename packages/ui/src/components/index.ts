/**
 * All styled, ready-to-use components.
 * These are built on top of primitives and themes.
 */

// Base components
export { Button, buttonVariants, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardStripe,
  CardAccent,
  CardCorner,
  cardVariants,
  getStaggerDelay,
  STAGGER_DELAYS,
  type CardProps,
  type CardStripeProps,
  type CardAccentProps,
  type StatusGradient,
} from './card';
export { Label } from './label';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export { Avatar, AvatarImage, AvatarFallback, UserAvatar } from './avatar';
export { Skeleton } from './skeleton';
export { Checkbox } from './checkbox';
export { Switch } from './switch';
export { Textarea, type TextareaProps } from './textarea';
export { Slider } from './slider';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Progress } from './progress';
export { Separator } from './separator';
export { Alert, AlertTitle, AlertDescription } from './alert';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';

// DataTable
export {
  DataTable,
  BaseTable,
  TableEmptyState,
  LoadingState,
  RowActionsMenu,
  InlineActions,
  BulkActionsBar,
  SortableHeader,
  TableToolbar,
  TablePagination,
  type TableEmptyStateProps,
  type LoadingStateProps,
  type RowActionsMenuProps,
  type InlineActionsProps,
  type BulkActionsBarProps,
  type SortableHeaderProps,
  type TableToolbarProps,
  type TablePaginationProps,
} from './data-table';
export type {
  TableColumn,
  RowAction,
  BulkAction,
  ActionVariant,
  ActionGroup,
  RowStatus,
  ActionDisplay,
  EmptyAction,
  FilterConfig,
  FilterOption,
  SortState,
  FilterState,
  PaginationState,
  RowSelectionState,
  TableDensity,
  DataTableProps,
  BaseTableProps,
} from './data-table';
export {
  tableContainerVariants,
  tableRowVariants,
  tableCellVariants,
  tableHeadVariants,
  cellContentVariants,
  actionMenuItemVariants,
  inlineActionButtonVariants,
  bulkActionsBarVariants,
} from './data-table';

// Form Field
export {
  FormField,
  FormFieldLabel,
  FormFieldDescription,
  FormFieldError,
  FormFieldControl,
  Form,
  type FormFieldProps,
  type FormFieldLabelProps,
  type FormFieldDescriptionProps,
  type FormFieldErrorProps,
  type FormFieldControlProps,
} from './form-field';

// Date Picker
export {
  Calendar,
  DatePicker,
  DateRangePicker,
  TimeInput,
  type CalendarProps,
  type DateRange,
  type DatePickerProps,
  type DateRangePickerProps,
  type TimeInputProps,
} from './date-picker';

// Combobox
export { Combobox, type ComboboxProps, type ComboboxOption } from './combobox';

// CopyButton
export { CopyButton, type CopyButtonProps } from './copy-button';

// FileUpload
export {
  FileUpload,
  type FileUploadProps,
  type UploadedFile,
} from './file-upload';

// EmptyState
export { EmptyState, type EmptyStateProps } from './empty-state';

// PageHeader
export {
  PageHeader,
  Breadcrumbs,
  type PageHeaderProps,
  type BreadcrumbsProps,
  type BreadcrumbItem,
} from './page-header';

// Timeline
export {
  Timeline,
  TimelineItem,
  type TimelineProps,
  type TimelineItemProps,
} from './timeline';

// MetricCard
export {
  MetricCard,
  Sparkline,
  type MetricCardProps,
  type SparklineProps,
} from './metric-card';

// AppShell
export {
  AppShell,
  AppShellProvider,
  useAppShell,
  AppShellHeader,
  AppShellSidebar,
  AppShellContent,
  type AppShellProps,
  type AppShellContextValue,
  type AppShellProviderProps,
  type AppShellHeaderProps,
  type AppShellSidebarProps,
  type AppShellContentProps,
} from './app-shell';

// Re-export primitives for convenience
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  ScrollArea,
  ScrollBar,
  Slot,
  Slottable,
} from '../primitives';
