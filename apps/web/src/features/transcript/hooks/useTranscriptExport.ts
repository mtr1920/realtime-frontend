/**
 * useTranscriptExport Hook
 *
 * Provides transcript export functionality in various formats.
 */

import { useCallback } from 'react';
import { useTranscriptStore, selectFinalTurns } from '../stores/transcript.store';
import type {
  TranscriptTurn,
  TranscriptExportFormat,
  TranscriptExportOptions,
} from '../types/transcript.types';

export interface UseTranscriptExportResult {
  /** Export transcript to file */
  exportTranscript: (options: TranscriptExportOptions) => void;
  /** Get export data as string */
  getExportData: (options: TranscriptExportOptions) => string;
}

/**
 * Format timestamp for SRT format (HH:MM:SS,mmm)
 */
function formatSrtTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds},${ms}`;
}

/**
 * Convert turns to plain text format
 */
function toTextFormat(
  turns: TranscriptTurn[],
  options: TranscriptExportOptions
): string {
  return turns
    .map((turn) => {
      let line = '';
      if (options.includeTimestamps) {
        const time = new Date(turn.startedAt).toLocaleTimeString();
        line += `[${time}] `;
      }
      if (options.includeSpeakerRoles) {
        line += `${turn.speakerRole}: `;
      }
      line += turn.content;
      return line;
    })
    .join('\n');
}

/**
 * Convert turns to SRT subtitle format
 */
function toSrtFormat(turns: TranscriptTurn[]): string {
  return turns
    .map((turn, index) => {
      const startTime = formatSrtTime(turn.startedAt);
      // Assume 5 seconds duration for each entry (adjust as needed)
      const endDate = new Date(new Date(turn.startedAt).getTime() + 5000);
      const endTime = formatSrtTime(endDate.toISOString());

      return `${index + 1}
${startTime} --> ${endTime}
${turn.content}`;
    })
    .join('\n\n');
}

/**
 * Convert turns to CSV format
 */
function toCsvFormat(turns: TranscriptTurn[]): string {
  const headers = ['Timestamp', 'Speaker', 'Role', 'Content'];
  const rows = turns.map((turn) => [
    turn.startedAt,
    turn.speakerId,
    turn.speakerRole,
    `"${turn.content.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Hook for transcript export functionality
 *
 * @example
 * ```tsx
 * const { exportTranscript } = useTranscriptExport();
 *
 * return (
 *   <button onClick={() => exportTranscript({ format: 'txt' })}>
 *     Export as Text
 *   </button>
 * );
 * ```
 */
export function useTranscriptExport(): UseTranscriptExportResult {
  const finalTurns = useTranscriptStore(selectFinalTurns);

  const getExportData = useCallback(
    (options: TranscriptExportOptions): string => {
      const { format, includeTimestamps = true, includeSpeakerRoles = true } = options;

      switch (format) {
        case 'json':
          return JSON.stringify(finalTurns, null, 2);
        case 'txt':
          return toTextFormat(finalTurns, { ...options, includeTimestamps, includeSpeakerRoles });
        case 'srt':
          return toSrtFormat(finalTurns);
        case 'csv':
          return toCsvFormat(finalTurns);
        default:
          return '';
      }
    },
    [finalTurns]
  );

  const exportTranscript = useCallback(
    (options: TranscriptExportOptions) => {
      const data = getExportData(options);
      const mimeTypes: Record<TranscriptExportFormat, string> = {
        json: 'application/json',
        txt: 'text/plain',
        srt: 'text/srt',
        csv: 'text/csv',
      };

      const blob = new Blob([data], { type: mimeTypes[options.format] });
      const url = URL.createObjectURL(blob);
      const filename = `transcript-${new Date().toISOString().slice(0, 10)}.${options.format}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [getExportData]
  );

  return {
    exportTranscript,
    getExportData,
  };
}
