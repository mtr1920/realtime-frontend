/**
 * DataTable Component
 *
 * Full-featured table component with sorting, filtering, and pagination.
 * Composes BaseTable and adds state management + toolbar/pagination.
 * Uses local state - no centralized Zustand store.
 */

import { useState, useMemo, useDeferredValue, useCallback } from 'react';
import type { ReactNode } from 'react';
import { BaseTable } from './BaseTable';
import { SortableHeader } from './parts/SortableHeader';
import { TableToolbar } from './parts/TableToolbar';
import { TablePagination } from './parts/TablePagination';
import { BulkActionsBar } from './parts/BulkActionsBar';
import { ExportButtons } from './parts/ExportButtons';
import { tableContainerVariants } from './variants';
import type {
  DataTableProps,
  TableColumn,
  SortState,
  PaginationState,
  RowSelectionState,
} from './types';
import { cn } from '../../utils';

// ============================================================================
// Helpers
// ============================================================================

function getCellValue<TData>(row: TData, column: TableColumn<TData>): unknown {
  if (column.accessor) {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  }
  return undefined;
}

function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const aVal = a ?? '';
  const bVal = b ?? '';

  let result = 0;
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    result = aVal.localeCompare(bVal);
  } else if (typeof aVal === 'number' && typeof bVal === 'number') {
    result = aVal - bVal;
  } else if (aVal instanceof Date && bVal instanceof Date) {
    result = aVal.getTime() - bVal.getTime();
  } else {
    result = String(aVal).localeCompare(String(bVal));
  }

  return direction === 'desc' ? -result : result;
}

function matchesGlobalSearch<TData>(
  row: TData,
  columns: TableColumn<TData>[],
  searchTerm: string
): boolean {
  const lowerSearch = searchTerm.toLowerCase();
  return columns.some((column) => {
    const value = getCellValue(row, column);
    if (value == null) return false;
    return String(value).toLowerCase().includes(lowerSearch);
  });
}

// ============================================================================
// Component
// ============================================================================

export function DataTable<TData>({
  data,
  columns,
  getRowId: getRowIdFn,
  isLoading = false,
  density = 'default',

  // Features
  enableSorting = false,
  enableGlobalSearch = false,
  enablePagination = false,
  enableRowSelection = false,

  // Controlled state
  sorting: controlledSorting,
  onSortingChange,
  pagination: controlledPagination,
  onPaginationChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  globalSearch: controlledGlobalSearch,
  onGlobalSearchChange,

  // Pagination options
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],

  // Row actions
  rowActions,
  onRowClick,
  actionDisplay,

  // Bulk actions
  bulkActions,

  // Row status
  getRowStatus,

  // Empty state
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,

  // Toolbar
  showToolbar = true,
  onExportCsv,
  onExportExcel,
  toolbarRightContent,

  // Styling
  striped = false,
  className,
}: DataTableProps<TData>) {
  // Local state (used when not controlled)
  const [localSorting, setLocalSorting] = useState<SortState[]>([]);
  const [localPagination, setLocalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [localRowSelection, setLocalRowSelection] = useState<RowSelectionState>({});
  const [localGlobalSearch, setLocalGlobalSearch] = useState('');

  // Use controlled or local state
  const sorting = controlledSorting ?? localSorting;
  const setSorting = onSortingChange ?? setLocalSorting;
  const pagination = controlledPagination ?? localPagination;
  const setPagination = onPaginationChange ?? setLocalPagination;
  const rowSelection = controlledRowSelection ?? localRowSelection;
  const setRowSelection = onRowSelectionChange ?? setLocalRowSelection;
  const globalSearch = controlledGlobalSearch ?? localGlobalSearch;
  const setGlobalSearch = onGlobalSearchChange ?? setLocalGlobalSearch;

  // Defer search for responsiveness
  const deferredSearch = useDeferredValue(globalSearch);

  // Process data: filter, sort, paginate
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global search
    if (deferredSearch) {
      result = result.filter((row) =>
        matchesGlobalSearch(row, columns, deferredSearch)
      );
    }

    // Apply sorting
    if (sorting.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorting) {
          const column = columns.find((c) => c.id === sort.columnId);
          if (column) {
            const aVal = getCellValue(a, column);
            const bVal = getCellValue(b, column);
            const comparison = compareValues(aVal, bVal, sort.direction);
            if (comparison !== 0) return comparison;
          }
        }
        return 0;
      });
    }

    return result;
  }, [data, columns, deferredSearch, sorting]);

  // Paginate
  const paginatedData = useMemo(() => {
    if (!enablePagination) return processedData;
    const { pageIndex, pageSize } = pagination;
    const start = pageIndex * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, pagination, enablePagination]);

  // Sort handler
  const handleSort = useCallback(
    (columnId: string) => {
      const existing = sorting.find((s) => s.columnId === columnId);
      let newSorting: SortState[];
      if (!existing) {
        newSorting = [{ columnId, direction: 'asc' }];
      } else if (existing.direction === 'asc') {
        newSorting = [{ columnId, direction: 'desc' }];
      } else {
        newSorting = [];
      }
      setSorting(newSorting);
    },
    [sorting, setSorting]
  );

  // Row selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelection: RowSelectionState = {};
        paginatedData.forEach((row, index) => {
          const record = row as Record<string, unknown>;
          const id =
            getRowIdFn?.(row) ??
            (typeof record.id === 'string'
              ? record.id
              : typeof record.id === 'number'
                ? String(record.id)
                : String(index));
          newSelection[id] = true;
        });
        setRowSelection(newSelection);
      } else {
        setRowSelection({});
      }
    },
    [paginatedData, getRowIdFn, setRowSelection]
  );

  const handleSelectRow = useCallback(
    (rowId: string, checked: boolean) => {
      const next = { ...rowSelection };
      if (checked) {
        next[rowId] = true;
      } else {
        delete next[rowId];
      }
      setRowSelection(next);
    },
    [rowSelection, setRowSelection]
  );

  // Render header with sorting support
  const renderHeader = useCallback(
    (column: TableColumn<TData>): ReactNode => {
      const isSortable = enableSorting && column.sortable !== false;

      if (isSortable) {
        return (
          <SortableHeader
            columnId={column.id}
            sortState={sorting}
            onSort={handleSort}
          >
            {typeof column.header === 'function' ? column.header() : column.header}
          </SortableHeader>
        );
      }

      return typeof column.header === 'function' ? column.header() : column.header;
    },
    [enableSorting, sorting, handleSort]
  );

  const hasExport = onExportCsv || onExportExcel;
  const showToolbarArea = showToolbar && (enableGlobalSearch || hasExport || toolbarRightContent);

  // Toolbar right content with export buttons
  const toolbarRight = useMemo(() => {
    if (!hasExport && !toolbarRightContent) return undefined;

    return (
      <>
        {hasExport && (
          <ExportButtons
            data={processedData}
            onExportCsv={onExportCsv}
            onExportExcel={onExportExcel}
          />
        )}
        {toolbarRightContent}
      </>
    );
  }, [hasExport, toolbarRightContent, processedData, onExportCsv, onExportExcel]);

  // Get selected rows for bulk actions
  const selectedRows = useMemo(() => {
    if (!enableRowSelection) return [];
    return data.filter((row, index) => {
      const record = row as Record<string, unknown>;
      const id =
        getRowIdFn?.(row) ??
        (typeof record.id === 'string'
          ? record.id
          : typeof record.id === 'number'
            ? String(record.id)
            : String(index));
      return rowSelection[id];
    });
  }, [data, rowSelection, getRowIdFn, enableRowSelection]);

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k]
  ).length;

  const handleClearSelection = useCallback(() => {
    setRowSelection({});
  }, [setRowSelection]);

  const hasBulkActions = bulkActions && bulkActions.length > 0;
  const showBulkActionsBar = hasBulkActions && selectedCount > 0;

  return (
    <div className={cn(tableContainerVariants(), className)}>
      {/* Toolbar */}
      {showToolbarArea && (
        <TableToolbar
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          enableSearch={enableGlobalSearch}
          rightContent={toolbarRight}
        />
      )}

      {/* Bulk Actions Bar */}
      {showBulkActionsBar && (
        <BulkActionsBar
          selectedCount={selectedCount}
          selectedRows={selectedRows}
          actions={bulkActions}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Table */}
      <BaseTable
        data={paginatedData}
        columns={columns}
        getRowId={getRowIdFn}
        isLoading={isLoading}
        density={density}
        rowActions={rowActions}
        onRowClick={onRowClick}
        actionDisplay={actionDisplay}
        getRowStatus={getRowStatus}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyIcon={emptyIcon}
        emptyAction={emptyAction}
        striped={striped}
        wrapContainer={false}
        enableRowSelection={enableRowSelection}
        rowSelection={rowSelection}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        renderHeader={enableSorting ? renderHeader : undefined}
      />

      {/* Pagination */}
      {enablePagination && !isLoading && (
        <TablePagination
          pagination={pagination}
          onPaginationChange={setPagination}
          totalItems={processedData.length}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
