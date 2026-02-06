/**
 * Recording Stream Service
 *
 * MediaRecorder wrapper for capturing media streams with
 * real-time streaming to backend via WebSocket.
 */

export interface RecordingStreamOptions {
  /** Target MIME type (will detect supported variant) */
  mimeType?: string;
  /** Video bitrate in bits per second */
  videoBitsPerSecond?: number;
  /** Audio bitrate in bits per second */
  audioBitsPerSecond?: number;
  /** Chunk interval in milliseconds for streaming */
  chunkIntervalMs?: number;
  /** Callback for each recorded chunk (for streaming) */
  onChunk?: (chunk: Blob, index: number) => void;
  /** Callback when recording stops */
  onStop?: (allChunks: Blob[]) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface RecordingStreamService {
  /** Start recording */
  start: () => void;
  /** Stop recording */
  stop: () => void;
  /** Pause recording */
  pause: () => void;
  /** Resume recording */
  resume: () => void;
  /** Get current state */
  getState: () => RecordingState;
  /** Get all recorded chunks */
  getChunks: () => Blob[];
  /** Get the detected MIME type */
  getMimeType: () => string;
}

export type RecordingState = 'inactive' | 'recording' | 'paused';

// Preferred MIME types in order of preference
const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4',
];

/**
 * Detect the best supported MIME type
 */
export function detectSupportedMimeType(preferredType?: string): string {
  // Try preferred type first
  if (preferredType && MediaRecorder.isTypeSupported(preferredType)) {
    return preferredType;
  }

  // Find first supported type
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Return empty string to use browser default
  return '';
}

/**
 * Create a recording stream service
 *
 * @example
 * ```typescript
 * const recorder = createRecordingStream(combinedStream, {
 *   chunkIntervalMs: 1000, // Stream every second
 *   onChunk: (chunk, index) => {
 *     // Send chunk via WebSocket for real-time streaming
 *     sendRecordingChunk(chunk, index);
 *   },
 *   onStop: (chunks) => console.log('Recording complete', chunks.length),
 * });
 *
 * recorder.start();
 * ```
 */
export function createRecordingStream(
  stream: MediaStream,
  options: RecordingStreamOptions = {}
): RecordingStreamService {
  const {
    mimeType: preferredMimeType,
    videoBitsPerSecond = 2500000, // 2.5 Mbps
    audioBitsPerSecond = 128000, // 128 kbps
    chunkIntervalMs = 1000, // 1 second for real-time streaming
    onChunk,
    onStop,
    onError,
  } = options;

  // Detect supported MIME type
  const mimeType = detectSupportedMimeType(preferredMimeType);

  // Create MediaRecorder
  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond,
    audioBitsPerSecond,
  };

  if (mimeType) {
    recorderOptions.mimeType = mimeType;
  }

  const mediaRecorder = new MediaRecorder(stream, recorderOptions);

  // Track chunks
  const chunks: Blob[] = [];
  let chunkIndex = 0;

  // Handle data available - called at chunkIntervalMs intervals
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      onChunk?.(event.data, chunkIndex);
      chunkIndex++;
    }
  };

  // Handle stop
  mediaRecorder.onstop = () => {
    onStop?.(chunks);
  };

  // Handle error
  mediaRecorder.onerror = (event) => {
    const error = new Error(`MediaRecorder error: ${(event as ErrorEvent).message || 'Unknown error'}`);
    onError?.(error);
  };

  // Start recording
  function start(): void {
    if (mediaRecorder.state === 'inactive') {
      chunks.length = 0;
      chunkIndex = 0;
      mediaRecorder.start(chunkIntervalMs);
    }
  }

  // Stop recording
  function stop(): void {
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  // Pause recording
  function pause(): void {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
  }

  // Resume recording
  function resume(): void {
    if (mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
  }

  // Get current state
  function getState(): RecordingState {
    return mediaRecorder.state;
  }

  // Get all chunks
  function getChunks(): Blob[] {
    return [...chunks];
  }

  // Get MIME type
  function getMimeType(): string {
    return mediaRecorder.mimeType || mimeType;
  }

  return {
    start,
    stop,
    pause,
    resume,
    getState,
    getChunks,
    getMimeType,
  };
}

/**
 * Create a Blob from recorded chunks
 */
export function createRecordingBlob(chunks: Blob[], mimeType: string): Blob {
  return new Blob(chunks, { type: mimeType });
}

/**
 * Convert Blob to ArrayBuffer for WebSocket transmission
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Convert Blob to Base64 string for WebSocket transmission
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
