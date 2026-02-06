/**
 * ExportButtons Component
 *
 * Dual export buttons for CSV and Excel formats with distinct colored backgrounds.
 * Designed for use in DataTable toolbar.
 */

import { FileText, Sheet } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../primitives/tooltip';
import { cn } from '../../../utils';

export interface ExportButtonsProps<TData> {
  /** Data to export */
  data: TData[];
  /** CSV export handler */
  onExportCsv?: (data: TData[]) => void;
  /** Excel export handler */
  onExportExcel?: (data: TData[]) => void;
  /** Additional className */
  className?: string;
}

export function ExportButtons<TData>({
  data,
  onExportCsv,
  onExportExcel,
  className,
}: ExportButtonsProps<TData>) {
  const hasData = data.length > 0;
  const showAnyButton = onExportCsv || onExportExcel;

  if (!showAnyButton) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {onExportCsv && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onExportCsv(data)}
              disabled={!hasData}
              aria-label="Export to CSV"
              className={cn(
                'inline-flex items-center justify-center rounded-md transition-colors',
                'h-9 w-9',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                hasData
                  ? 'bg-info/15 text-info hover:bg-info/25 dark:bg-info/20 dark:hover:bg-info/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              <FileText className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export to CSV</p>
          </TooltipContent>
        </Tooltip>
      )}

      {onExportExcel && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onExportExcel(data)}
              disabled={!hasData}
              aria-label="Export to Excel"
              className={cn(
                'inline-flex items-center justify-center rounded-md transition-colors',
                'h-9 w-9',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                hasData
                  ? 'bg-success/15 text-success hover:bg-success/25 dark:bg-success/20 dark:hover:bg-success/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              )}
            >
              <Sheet className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Export to Excel</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
