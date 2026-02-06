/**
 * DataTable Exports
 *
 * New DataTable implementation with local state management.
 * No TanStack Table dependency - uses native React 19 patterns.
 */

// Main components
export { DataTable } from './DataTable';
export { BaseTable } from './BaseTable';

// Parts
export { TableEmptyState, type TableEmptyStateProps } from './parts/EmptyState';
export { LoadingState, type LoadingStateProps } from './parts/LoadingState';
export { RowActionsMenu, type RowActionsMenuProps } from './parts/RowActionsMenu';
export { InlineActions, type InlineActionsProps } from './parts/InlineActions';
export { BulkActionsBar, type BulkActionsBarProps } from './parts/BulkActionsBar';
export { SortableHeader, type SortableHeaderProps } from './parts/SortableHeader';
export { TableToolbar, type TableToolbarProps } from './parts/TableToolbar';
export { TablePagination, type TablePaginationProps } from './parts/TablePagination';
export { ExportButtons, type ExportButtonsProps } from './parts/ExportButtons';

// Types
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
} from './types';

// Variants (for custom styling)
export {
  tableContainerVariants,
  tableRowVariants,
  tableCellVariants,
  tableHeadVariants,
  cellContentVariants,
  emptyStateVariants,
  emptyIconVariants,
  emptyTitleVariants,
  emptyDescriptionVariants,
  loadingSkeletonVariants,
  toolbarVariants,
  toolbarLeftVariants,
  toolbarRightVariants,
  paginationVariants,
  paginationInfoVariants,
  paginationControlsVariants,
  actionMenuItemVariants,
  inlineActionButtonVariants,
  bulkActionsBarVariants,
  bulkActionsInfoVariants,
  bulkActionsControlsVariants,
} from './variants';
