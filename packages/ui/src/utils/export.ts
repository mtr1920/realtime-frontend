/**
 * Data Export Utilities
 *
 * Generic functions for exporting tabular data to CSV and Excel formats.
 * These are pure utilities with no business logic.
 */

import * as XLSX from 'xlsx';

// ============================================================================
// Types
// ============================================================================

/**
 * Column definition for export
 */
export interface ExportColumn<TData> {
  /** Column header text */
  header: string;
  /** Data accessor - key or function */
  accessor: keyof TData | ((row: TData) => unknown);
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Filename without extension */
  filename?: string;
  /** Sheet name for Excel export */
  sheetName?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract cell value from row using accessor
 */
function getCellValue<TData>(row: TData, accessor: ExportColumn<TData>['accessor']): string {
  const value = typeof accessor === 'function' ? accessor(row) : row[accessor];

  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

/**
 * Escape CSV cell value (handles quotes and commas)
 */
function escapeCsvCell(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate filename with date
 */
function generateFilename(base?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const prefix = base || 'export';
  return `${prefix}-${date}`;
}

/**
 * Trigger browser download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export data to CSV format
 */
export function exportToCsv<TData>(
  data: TData[],
  columns: ExportColumn<TData>[],
  options: ExportOptions = {}
): void {
  if (data.length === 0) {
    console.warn('exportToCsv: No data to export');
    return;
  }

  const headers = columns.map((col) => escapeCsvCell(col.header));

  const rows = data.map((row) =>
    columns.map((col) => escapeCsvCell(getCellValue(row, col.accessor)))
  );

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${generateFilename(options.filename)}.csv`;

  downloadBlob(blob, filename);
}

/**
 * Export data to Excel (XLSX) format
 */
export function exportToExcel<TData>(
  data: TData[],
  columns: ExportColumn<TData>[],
  options: ExportOptions = {}
): void {
  if (data.length === 0) {
    console.warn('exportToExcel: No data to export');
    return;
  }

  // Prepare data for xlsx
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) => columns.map((col) => getCellValue(row, col.accessor)));

  // Create worksheet
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns (approximate)
  const colWidths = columns.map((col) => {
    const maxContentLength = Math.max(
      col.header.length,
      ...data.slice(0, 100).map((row) => getCellValue(row, col.accessor).length)
    );
    return { wch: Math.min(Math.max(maxContentLength + 2, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `${generateFilename(options.filename)}.xlsx`;

  downloadBlob(blob, filename);
}

/**
 * Simple export for flat data arrays (auto-detects columns from first row)
 */
export function exportArrayToCsv<TData extends Record<string, unknown>>(
  data: TData[],
  options: ExportOptions = {}
): void {
  const firstRow = data[0];
  if (!firstRow) {
    console.warn('exportArrayToCsv: No data to export');
    return;
  }

  const keys = Object.keys(firstRow) as (keyof TData)[];
  const columns: ExportColumn<TData>[] = keys.map((key) => ({
    header: String(key),
    accessor: key,
  }));

  exportToCsv(data, columns, options);
}

/**
 * Simple export for flat data arrays to Excel (auto-detects columns from first row)
 */
export function exportArrayToExcel<TData extends Record<string, unknown>>(
  data: TData[],
  options: ExportOptions = {}
): void {
  const firstRow = data[0];
  if (!firstRow) {
    console.warn('exportArrayToExcel: No data to export');
    return;
  }

  const keys = Object.keys(firstRow) as (keyof TData)[];
  const columns: ExportColumn<TData>[] = keys.map((key) => ({
    header: String(key),
    accessor: key,
  }));

  exportToExcel(data, columns, options);
}
