/**
 * TranscriptExport Component
 *
 * Export controls for transcript in various formats.
 */

import { useState, useCallback } from 'react';
import { Download, FileJson, FileText, FileVideo, FileSpreadsheet } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { useTranscriptExport } from '../hooks/useTranscriptExport';
import type { TranscriptExportFormat } from '../types/transcript.types';

export interface TranscriptExportProps {
  /** Whether export is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

interface ExportOption {
  format: TranscriptExportFormat;
  label: string;
  icon: typeof FileJson;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'json',
    label: 'JSON',
    icon: FileJson,
    description: 'Structured data format',
  },
  {
    format: 'txt',
    label: 'Plain Text',
    icon: FileText,
    description: 'Simple text file',
  },
  {
    format: 'srt',
    label: 'SRT Subtitles',
    icon: FileVideo,
    description: 'Subtitle format',
  },
  {
    format: 'csv',
    label: 'CSV',
    icon: FileSpreadsheet,
    description: 'Spreadsheet compatible',
  },
];

/**
 * Transcript export dropdown
 *
 * @example
 * ```tsx
 * <TranscriptExport disabled={turnsCount === 0} />
 * ```
 */
export function TranscriptExport({ disabled, className }: TranscriptExportProps) {
  const { exportTranscript } = useTranscriptExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(
    async (format: TranscriptExportFormat) => {
      setIsExporting(true);
      try {
        exportTranscript({
          format,
          includeTimestamps: true,
          includeSpeakerRoles: true,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exportTranscript]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.format}
            onClick={() => handleExport(option.format)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <option.icon className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
