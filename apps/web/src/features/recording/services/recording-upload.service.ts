/**
 * Recording Upload Service
 *
 * Chunked upload with retry logic and exponential backoff.
 */

export interface UploadChunkOptions {
  /** Recording ID from server */
  recordingId: string;
  /** Chunk data */
  chunk: Blob;
  /** Chunk index (0-based) */
  chunkIndex: number;
  /** Whether this is the final chunk */
  isFinal?: boolean;
  /** Upload endpoint URL */
  endpoint: string;
  /** Authentication token */
  authToken?: string;
}

export interface UploadResult {
  /** Whether upload succeeded */
  success: boolean;
  /** Server response (if successful) */
  response?: unknown;
  /** Error message (if failed) */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
}

export interface UploadServiceOptions {
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  initialRetryDelayMs?: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelayMs?: number;
  /** Timeout per upload in milliseconds */
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<UploadServiceOptions> = {
  maxRetries: 3,
  initialRetryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  timeoutMs: 60000,
};

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attempt: number,
  initialDelay: number,
  maxDelay: number
): number {
  const delay = initialDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * delay; // 10% jitter
  return Math.min(delay + jitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a single chunk with retry logic
 *
 * @example
 * ```typescript
 * const result = await uploadChunk({
 *   recordingId: 'rec_123',
 *   chunk: blobData,
 *   chunkIndex: 0,
 *   endpoint: '/api/recordings/upload',
 *   authToken: 'bearer_token',
 * });
 *
 * if (result.success) {
 *   console.log('Chunk uploaded');
 * }
 * ```
 */
export async function uploadChunk(
  options: UploadChunkOptions,
  serviceOptions: UploadServiceOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...serviceOptions };
  const { recordingId, chunk, chunkIndex, isFinal, endpoint, authToken } = options;

  let lastError: string | undefined;
  let retryCount = 0;

  while (retryCount <= opts.maxRetries) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('recordingId', recordingId);
      formData.append('chunkIndex', String(chunkIndex));
      formData.append('isFinal', String(isFinal ?? false));
      formData.append('chunk', chunk, `chunk_${chunkIndex}.webm`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);

      // Upload
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        response: data,
        retryCount,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      if (retryCount < opts.maxRetries) {
        const delay = calculateBackoff(
          retryCount,
          opts.initialRetryDelayMs,
          opts.maxRetryDelayMs
        );
        console.warn(
          `[RecordingUpload] Chunk ${chunkIndex} upload failed, retrying in ${delay}ms:`,
          lastError
        );
        await sleep(delay);
        retryCount++;
      } else {
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError,
    retryCount,
  };
}

/**
 * Upload queue manager for sequential chunk uploads
 */
export interface UploadQueueManager {
  /** Add a chunk to the upload queue */
  enqueue: (chunk: Blob, chunkIndex: number, isFinal?: boolean) => void;
  /** Get upload progress */
  getProgress: () => UploadProgress;
  /** Cancel pending uploads */
  cancel: () => void;
  /** Wait for all uploads to complete */
  waitForCompletion: () => Promise<void>;
}

export interface UploadProgress {
  /** Total chunks queued */
  totalChunks: number;
  /** Chunks uploaded successfully */
  uploadedChunks: number;
  /** Chunks that failed */
  failedChunks: number;
  /** Whether upload is in progress */
  isUploading: boolean;
}

export interface UploadQueueOptions extends UploadServiceOptions {
  /** Recording ID */
  recordingId: string;
  /** Upload endpoint */
  endpoint: string;
  /** Auth token */
  authToken?: string;
  /** Callback on chunk upload success */
  onChunkUploaded?: (chunkIndex: number) => void;
  /** Callback on chunk upload failure */
  onChunkFailed?: (chunkIndex: number, error: string) => void;
  /** Callback when all uploads complete */
  onComplete?: (progress: UploadProgress) => void;
}

/**
 * Create an upload queue manager
 *
 * @example
 * ```typescript
 * const queue = createUploadQueue({
 *   recordingId: 'rec_123',
 *   endpoint: '/api/recordings/upload',
 *   authToken: token,
 *   onChunkUploaded: (index) => console.log(`Chunk ${index} uploaded`),
 * });
 *
 * // In recording callback
 * queue.enqueue(chunk, index);
 *
 * // When recording stops
 * await queue.waitForCompletion();
 * ```
 */
export function createUploadQueue(options: UploadQueueOptions): UploadQueueManager {
  const {
    recordingId,
    endpoint,
    authToken,
    onChunkUploaded,
    onChunkFailed,
    onComplete,
    ...uploadOptions
  } = options;

  interface QueueItem {
    chunk: Blob;
    chunkIndex: number;
    isFinal: boolean;
  }

  const queue: QueueItem[] = [];
  let isProcessing = false;
  let isCancelled = false;
  let uploadedChunks = 0;
  let failedChunks = 0;

  let resolveCompletion: (() => void) | null = null;

  // Process queue
  async function processQueue(): Promise<void> {
    if (isProcessing || isCancelled) return;
    isProcessing = true;

    while (queue.length > 0 && !isCancelled) {
      const item = queue.shift();
      if (!item) continue;

      const result = await uploadChunk(
        {
          recordingId,
          chunk: item.chunk,
          chunkIndex: item.chunkIndex,
          isFinal: item.isFinal,
          endpoint,
          authToken,
        },
        uploadOptions
      );

      if (result.success) {
        uploadedChunks++;
        onChunkUploaded?.(item.chunkIndex);
      } else {
        failedChunks++;
        onChunkFailed?.(item.chunkIndex, result.error || 'Unknown error');
      }
    }

    isProcessing = false;

    // Check if complete
    if (queue.length === 0 && resolveCompletion) {
      const progress = getProgress();
      onComplete?.(progress);
      resolveCompletion();
      resolveCompletion = null;
    }
  }

  // Enqueue a chunk
  function enqueue(chunk: Blob, chunkIndex: number, isFinal = false): void {
    if (isCancelled) return;

    queue.push({ chunk, chunkIndex, isFinal });
    processQueue();
  }

  // Get progress
  function getProgress(): UploadProgress {
    return {
      totalChunks: uploadedChunks + failedChunks + queue.length,
      uploadedChunks,
      failedChunks,
      isUploading: isProcessing,
    };
  }

  // Cancel pending uploads
  function cancel(): void {
    isCancelled = true;
    queue.length = 0;
  }

  // Wait for completion
  function waitForCompletion(): Promise<void> {
    if (queue.length === 0 && !isProcessing) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      resolveCompletion = resolve;
    });
  }

  return {
    enqueue,
    getProgress,
    cancel,
    waitForCompletion,
  };
}
