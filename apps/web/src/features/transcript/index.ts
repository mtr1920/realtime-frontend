/**
 * Transcript Feature
 *
 * Real-time transcript display and export functionality.
 */

// Components
export { TranscriptPanel } from './components/TranscriptPanel';
export type { TranscriptPanelProps } from './components/TranscriptPanel';
export { TranscriptEntry } from './components/TranscriptEntry';
export type { TranscriptEntryProps } from './components/TranscriptEntry';
export { TranscriptExport } from './components/TranscriptExport';
export type { TranscriptExportProps } from './components/TranscriptExport';

// Hooks
export { useTranscript } from './hooks/useTranscript';
export type { UseTranscriptOptions, UseTranscriptResult } from './hooks/useTranscript';
export { useTranscriptExport } from './hooks/useTranscriptExport';
export type { UseTranscriptExportResult } from './hooks/useTranscriptExport';

// Store
export {
  useTranscriptStore,
  selectTurnsCount,
  selectFinalTurns,
  selectTurnsBySpeaker,
} from './stores/transcript.store';

// Types
export type {
  TranscriptTurn,
  TranscriptState,
  TranscriptExportFormat,
  TranscriptExportOptions,
} from './types/transcript.types';
