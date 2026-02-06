/**
 * DataTable Types
 *
 * Core type definitions for the new DataTable component.
 * Uses local state instead of centralized Zustand store.
 */

import type { ReactNode } from 'react';

// ============================================================================
// Column Types
// ============================================================================

/**
 * Column definition for DataTable
 */
export interface TableColumn<TData> {
  /** Unique column identifier */
  id: string;
  /** Column header - string or render function */
  header: string | (() => ReactNode);
  /** Data accessor - key or function to extract cell value */
  accessor?: keyof TData | ((row: TData) => unknown);
  /** Custom cell renderer */
  cell?: (row: TData, index: number) => ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column is filterable */
  filterable?: boolean;
  /** Filter configuration */
  filter?: FilterConfig;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Additional CSS class for column cells */
  className?: string;
  /** Additional CSS class for header cell */
  headerClassName?: string;
  /** Column width (CSS value) */
  width?: string | number;
  /** Minimum column width */
  minWidth?: string | number;
  /** Whether column is hidden on mobile */
  hideOnMobile?: boolean;
  /** Whether column is hidden on tablet */
  hideOnTablet?: boolean;
}

/**
 * Filter configuration for a column
 */
export interface FilterConfig {
  /** Filter type */
  type: 'text' | 'select' | 'multi-select' | 'number-range' | 'date-range';
  /** Options for select/multi-select filters */
  options?: FilterOption[];
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Filter option for select filters
 */
export interface FilterOption {
  label: string;
  value: string;
}

// ============================================================================
// Row Action Types
// ============================================================================

/**
 * Action variant for color styling
 */
export type ActionVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

/**
 * Action group for visual separators
 */
export type ActionGroup = 'primary' | 'secondary' | 'danger';

/**
 * Row action menu item
 */
export interface RowAction<TData> {
  /** Unique action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Action variant for color styling */
  variant?: ActionVariant;
  /** Action group for visual separators in dropdown */
  group?: ActionGroup;
  /** Whether action is disabled */
  disabled?: boolean | ((row: TData) => boolean);
  /** Whether action is hidden */
  hidden?: boolean | ((row: TData) => boolean);
  /** Click handler */
  onClick: (row: TData) => void;
}

/**
 * Bulk action for selected rows
 */
export interface BulkAction<TData> {
  /** Unique action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Action variant for color styling */
  variant?: ActionVariant;
  /** Click handler with selected rows */
  onClick: (selectedRows: TData[]) => void;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Sort state for a column
 */
export interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter state for a column
 */
export interface FilterState {
  columnId: string;
  value: unknown;
}

/**
 * Pagination state
 */
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * Row selection state
 */
export type RowSelectionState = Record<string, boolean>;

// ============================================================================
// Table Density
// ============================================================================

/**
 * Table density options
 */
export type TableDensity = 'compact' | 'default' | 'comfortable';

/**
 * Row status for visual indication
 */
export type RowStatus = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Action display mode
 */
export type ActionDisplay = 'dropdown' | 'inline' | 'auto';

/**
 * Empty state action configuration
 */
export interface EmptyAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

// ============================================================================
// DataTable Props
// ============================================================================

export interface DataTableProps<TData> {
  /** Table data */
  data: TData[];
  /** Column definitions */
  columns: TableColumn<TData>[];
  /** Get unique row ID */
  getRowId?: (row: TData) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Table density */
  density?: TableDensity;

  // Features
  /** Enable sorting */
  enableSorting?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable global search */
  enableGlobalSearch?: boolean;
  /** Enable pagination */
  enablePagination?: boolean;
  /** Enable row selection */
  enableRowSelection?: boolean;

  // Controlled state
  /** Controlled sorting state */
  sorting?: SortState[];
  /** Sorting state change handler */
  onSortingChange?: (sorting: SortState[]) => void;
  /** Controlled filter state */
  filters?: FilterState[];
  /** Filter state change handler */
  onFiltersChange?: (filters: FilterState[]) => void;
  /** Controlled pagination state */
  pagination?: PaginationState;
  /** Pagination state change handler */
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Controlled row selection state */
  rowSelection?: RowSelectionState;
  /** Row selection state change handler */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Global search value */
  globalSearch?: string;
  /** Global search change handler */
  onGlobalSearchChange?: (value: string) => void;

  // Pagination options
  /** Initial page size */
  initialPageSize?: number;
  /** Page size options */
  pageSizeOptions?: number[];

  // Row actions
  /** Row action menu items */
  rowActions?: RowAction<TData>[];
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** How to display row actions: dropdown, inline, or auto (inline if ≤3 actions) */
  actionDisplay?: ActionDisplay;

  // Bulk actions
  /** Bulk action buttons shown when rows are selected */
  bulkActions?: BulkAction<TData>[];

  // Row status
  /** Function to determine row status for visual indication */
  getRowStatus?: (row: TData) => RowStatus;

  // Empty state
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Empty state action button */
  emptyAction?: EmptyAction;

  // Toolbar
  /** Show toolbar */
  showToolbar?: boolean;
  /** Export to CSV handler - shows CSV icon in toolbar when provided */
  onExportCsv?: (data: TData[]) => void;
  /** Export to Excel handler - shows Excel icon in toolbar when provided */
  onExportExcel?: (data: TData[]) => void;
  /** Custom toolbar right content (rendered after export buttons) */
  toolbarRightContent?: ReactNode;

  // Styling
  /** Show striped rows */
  striped?: boolean;
  /** Additional className */
  className?: string;
}

export interface BaseTableProps<TData> {
  /** Table data */
  data: TData[];
  /** Column definitions */
  columns: TableColumn<TData>[];
  /** Get unique row ID */
  getRowId?: (row: TData) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Table density */
  density?: TableDensity;
  /** Row action menu items */
  rowActions?: RowAction<TData>[];
  /** Row click handler */
  onRowClick?: (row: TData) => void;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Empty state action button */
  emptyAction?: EmptyAction;
  /** Show striped rows */
  striped?: boolean;
  /** Additional className */
  className?: string;

  // Row status
  /** Function to determine row status for visual indication */
  getRowStatus?: (row: TData) => RowStatus;

  // Action display
  /** How to display row actions: dropdown, inline, or auto (inline if ≤3 actions) */
  actionDisplay?: ActionDisplay;

  // Composition props (used by DataTable)
  /** Wrap table in styled container (default: true) */
  wrapContainer?: boolean;
  /** Enable row selection checkboxes */
  enableRowSelection?: boolean;
  /** Row selection state */
  rowSelection?: RowSelectionState;
  /** Select all handler */
  onSelectAll?: (checked: boolean) => void;
  /** Select row handler */
  onSelectRow?: (rowId: string, checked: boolean) => void;
  /** Custom header renderer (for sortable headers) */
  renderHeader?: (column: TableColumn<TData>) => ReactNode;
}
