/**
 * Recording Feature
 *
 * Recording state management, indicators, and consent handling.
 */

// Components
export { RecordingIndicator } from './components/RecordingIndicator';
export { RecordingConsent } from './components/RecordingConsent';
export type { RecordingConsentProps } from './components/RecordingConsent';

// Hooks
export { useRecordingStatus } from './hooks/useRecordingStatus';
export type { UseRecordingStatusResult } from './hooks/useRecordingStatus';
export { useRecordingConsent } from './hooks/useRecordingConsent';
export type { UseRecordingConsentResult } from './hooks/useRecordingConsent';
export { useRecording } from './hooks/useRecording';
export type {
  UseRecordingOptions,
  UseRecordingResult,
  RecordingStreams,
} from './hooks/useRecording';

// Services
export {
  createRecordingMixer,
  combineStreams,
} from './services/recording-mixer.service';
export type {
  AudioSource,
  MixerOptions,
  RecordingMixerService,
} from './services/recording-mixer.service';

export {
  createRecordingStream,
  detectSupportedMimeType,
  createRecordingBlob,
  blobToArrayBuffer,
  blobToBase64,
} from './services/recording-stream.service';
export type {
  RecordingStreamOptions,
  RecordingStreamService,
  RecordingState as RecordingStreamState,
} from './services/recording-stream.service';

export {
  uploadChunk,
  createUploadQueue,
} from './services/recording-upload.service';
export type {
  UploadChunkOptions,
  UploadResult,
  UploadServiceOptions,
  UploadQueueManager,
  UploadProgress,
  UploadQueueOptions,
} from './services/recording-upload.service';

// Store
export {
  useRecordingStore,
  selectIsRecording,
  selectIsRecordingInProgress,
  selectFormattedDuration,
} from './stores/recording.store';

// Types
export type {
  RecordingStatus,
  RecordingState,
  RecordingActions,
} from './types/recording.types';
