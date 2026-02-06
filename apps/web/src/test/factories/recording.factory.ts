/**
 * Recording Test Factory
 *
 * Create mock recording data for testing.
 */

// =============================================================================
// Types
// =============================================================================

export type RecordingStatus =
  | 'pending'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Recording {
  id: string;
  sessionId: string;
  status: RecordingStatus;
  startedAt?: string;
  stoppedAt?: string;
  duration?: number;
  size?: number;
  format: string;
  url?: string;
  error?: string;
}

export interface RecordingChunk {
  id: string;
  recordingId: string;
  sequenceNumber: number;
  data: string; // base64
  size: number;
  timestamp: string;
}

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_RECORDING: Recording = {
  id: 'recording-001',
  sessionId: 'session-001',
  status: 'pending',
  format: 'webm',
};

// =============================================================================
// Factory Functions
// =============================================================================

let recordingIdCounter = 0;
let chunkIdCounter = 0;

/**
 * Create a mock recording with optional overrides.
 */
export function createMockRecording(
  overrides: Partial<Recording> = {}
): Recording {
  recordingIdCounter++;
  return {
    ...DEFAULT_RECORDING,
    id: `recording-${String(recordingIdCounter).padStart(3, '0')}`,
    ...overrides,
  };
}

/**
 * Create a recording with specific status.
 */
export function createRecordingWithStatus(
  status: RecordingStatus,
  overrides: Partial<Recording> = {}
): Recording {
  const now = new Date();
  const recording = createMockRecording({ status, ...overrides });

  if (status === 'recording' || status === 'paused') {
    recording.startedAt = new Date(now.getTime() - 60000).toISOString();
    recording.duration = 60;
  }

  if (status === 'processing' || status === 'completed') {
    recording.startedAt = new Date(now.getTime() - 3600000).toISOString();
    recording.stoppedAt = now.toISOString();
    recording.duration = 3600;
  }

  if (status === 'completed') {
    recording.size = 52428800; // 50MB
    recording.url = `https://storage.example.com/recordings/${recording.id}.webm`;
  }

  if (status === 'failed') {
    recording.error = 'Recording failed due to codec error';
  }

  return recording;
}

/**
 * Create a recording that's actively recording.
 */
export function createActiveRecording(
  overrides: Partial<Recording> = {}
): Recording {
  return createRecordingWithStatus('recording', overrides);
}

/**
 * Create a completed recording with download URL.
 */
export function createCompletedRecording(
  overrides: Partial<Recording> = {}
): Recording {
  return createRecordingWithStatus('completed', overrides);
}

/**
 * Create a failed recording.
 */
export function createFailedRecording(
  error: string = 'Recording failed',
  overrides: Partial<Recording> = {}
): Recording {
  return createRecordingWithStatus('failed', { error, ...overrides });
}

/**
 * Create a mock recording chunk.
 */
export function createMockChunk(
  recordingId: string,
  sequenceNumber: number,
  overrides: Partial<RecordingChunk> = {}
): RecordingChunk {
  chunkIdCounter++;

  // Create fake base64 data (small for testing)
  const fakeData = btoa(
    Array(100)
      .fill(0)
      .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
      .join('')
  );

  return {
    id: `chunk-${String(chunkIdCounter).padStart(5, '0')}`,
    recordingId,
    sequenceNumber,
    data: fakeData,
    size: 100,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a batch of recording chunks.
 */
export function createChunkBatch(
  recordingId: string,
  count: number = 10
): RecordingChunk[] {
  return Array.from({ length: count }, (_, i) => {
    return createMockChunk(recordingId, i + 1);
  });
}

/**
 * Reset the recording ID counter (call in beforeEach for deterministic IDs).
 */
export function resetRecordingIdCounter(): void {
  recordingIdCounter = 0;
}

/**
 * Reset the chunk ID counter (call in beforeEach for deterministic IDs).
 */
export function resetChunkIdCounter(): void {
  chunkIdCounter = 0;
}

/**
 * Reset all recording-related counters.
 */
export function resetRecordingCounters(): void {
  resetRecordingIdCounter();
  resetChunkIdCounter();
}
