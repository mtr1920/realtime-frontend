/**
 * BaseTable Component
 *
 * Core table rendering component. Handles columns, rows, actions, loading, and empty states.
 * DataTable composes this component and adds sorting, filtering, pagination on top.
 */

import { useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../table';
import { Checkbox } from '../checkbox';
import { TableEmptyState } from './parts/EmptyState';
import { LoadingState } from './parts/LoadingState';
import { RowActionsMenu } from './parts/RowActionsMenu';
import { InlineActions } from './parts/InlineActions';
import {
  tableContainerVariants,
  tableRowVariants,
  tableCellVariants,
  tableHeadVariants,
} from './variants';
import type { BaseTableProps, TableColumn } from './types';
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

function getRowId<TData>(
  row: TData,
  index: number,
  getRowIdFn?: (row: TData) => string
): string {
  if (getRowIdFn) {
    return getRowIdFn(row);
  }
  const record = row as Record<string, unknown>;
  if (typeof record.id === 'string') return record.id;
  if (typeof record.id === 'number') return String(record.id);
  return String(index);
}

// ============================================================================
// Component
// ============================================================================

export function BaseTable<TData>({
  data,
  columns,
  getRowId: getRowIdFn,
  isLoading = false,
  density = 'default',
  rowActions,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  striped = false,
  className,
  getRowStatus,
  actionDisplay = 'dropdown',
  // Composition props (used by DataTable)
  wrapContainer = true,
  enableRowSelection = false,
  rowSelection = {},
  onSelectAll,
  onSelectRow,
  renderHeader,
}: BaseTableProps<TData>) {
  const handleRowClick = useCallback(
    (row: TData) => {
      onRowClick?.(row);
    },
    [onRowClick]
  );

  const hasRowActions = rowActions && rowActions.length > 0;
  const totalColumns =
    columns.length + (enableRowSelection ? 1 : 0) + (hasRowActions ? 1 : 0);

  // Determine whether to use inline actions
  const shouldUseInlineActions =
    hasRowActions &&
    (actionDisplay === 'inline' ||
      (actionDisplay === 'auto' && rowActions.length <= 3));

  // Selection state
  const allSelected =
    enableRowSelection &&
    data.length > 0 &&
    data.every((row, index) => {
      const id = getRowId(row, index, getRowIdFn);
      return rowSelection[id];
    });
  const someSelected =
    enableRowSelection &&
    data.some((row, index) => {
      const id = getRowId(row, index, getRowIdFn);
      return rowSelection[id];
    });

  const table = (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {/* Selection column header */}
          {enableRowSelection && (
            <TableHead className={cn(tableHeadVariants({ density }), 'w-12')}>
              <Checkbox
                checked={allSelected || (someSelected && 'indeterminate')}
                onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                aria-label="Select all"
              />
            </TableHead>
          )}

          {/* Data columns */}
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                tableHeadVariants({
                  density,
                  sortable: !!renderHeader && column.sortable !== false,
                  align: column.align,
                }),
                column.headerClassName,
                column.hideOnMobile && 'hidden sm:table-cell',
                column.hideOnTablet && 'hidden md:table-cell'
              )}
              style={{
                width: column.width,
                minWidth: column.minWidth,
              }}
            >
              {renderHeader
                ? renderHeader(column)
                : typeof column.header === 'function'
                  ? column.header()
                  : column.header}
            </TableHead>
          ))}

          {/* Actions column header */}
          {hasRowActions && (
            <TableHead
              className={cn(
                tableHeadVariants({ density, align: 'right' }),
                'w-12'
              )}
            >
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <LoadingState colCount={totalColumns} density={density} />
        ) : data.length === 0 ? (
          <TableEmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            colSpan={totalColumns}
            emptyAction={emptyAction}
          />
        ) : (
          data.map((row, rowIndex) => {
            const rowId = getRowId(row, rowIndex, getRowIdFn);
            const isSelected = enableRowSelection && !!rowSelection[rowId];
            const rowStatus = getRowStatus?.(row) ?? 'default';

            return (
              <TableRow
                key={rowId}
                className={tableRowVariants({
                  density,
                  interactive: !!onRowClick,
                  striped,
                  selected: isSelected,
                  status: isSelected ? 'default' : rowStatus,
                })}
                onClick={() => onRowClick && handleRowClick(row)}
                data-state={isSelected ? 'selected' : undefined}
              >
                {/* Selection cell */}
                {enableRowSelection && (
                  <TableCell
                    className={cn(tableCellVariants({ density }), 'w-12')}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        onSelectRow?.(rowId, checked === true)
                      }
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row ${rowId}`}
                    />
                  </TableCell>
                )}

                {/* Data cells */}
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      tableCellVariants({
                        density,
                        align: column.align,
                      }),
                      column.className,
                      column.hideOnMobile && 'hidden sm:table-cell',
                      column.hideOnTablet && 'hidden md:table-cell'
                    )}
                  >
                    {column.cell
                      ? column.cell(row, rowIndex)
                      : String(getCellValue(row, column) ?? '')}
                  </TableCell>
                ))}

                {/* Actions cell */}
                {hasRowActions && (
                  <TableCell
                    className={cn(
                      tableCellVariants({ density, align: 'right' }),
                      shouldUseInlineActions ? 'w-auto' : 'w-12'
                    )}
                  >
                    {shouldUseInlineActions ? (
                      <InlineActions row={row} actions={rowActions} />
                    ) : (
                      <RowActionsMenu row={row} actions={rowActions} />
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (wrapContainer) {
    return (
      <div className={cn(tableContainerVariants(), className)}>{table}</div>
    );
  }

  return table;
}
