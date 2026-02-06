/**
 * MediaRecorder Mock
 *
 * Mock MediaRecorder API for testing recording functionality.
 */

// Mock MediaRecorder for testing

// =============================================================================
// Types
// =============================================================================

export interface MockMediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
}

// =============================================================================
// Mock MediaRecorder
// =============================================================================

export class MockMediaRecorder implements MediaRecorder {
  readonly stream: MediaStream;
  readonly mimeType: string;
  readonly state: RecordingState = 'inactive';
  readonly audioBitsPerSecond: number;
  readonly videoBitsPerSecond: number;

  ondataavailable: ((this: MediaRecorder, ev: BlobEvent) => void) | null = null;
  onerror: ((this: MediaRecorder, ev: Event) => void) | null = null;
  onpause: ((this: MediaRecorder, ev: Event) => void) | null = null;
  onresume: ((this: MediaRecorder, ev: Event) => void) | null = null;
  onstart: ((this: MediaRecorder, ev: Event) => void) | null = null;
  onstop: ((this: MediaRecorder, ev: Event) => void) | null = null;

  private _listeners: Map<string, Set<EventListener>> = new Map();
  private _timeslice?: number;
  private _intervalId?: ReturnType<typeof setInterval>;
  private _chunkCounter = 0;

  constructor(stream: MediaStream, options?: MockMediaRecorderOptions) {
    this.stream = stream;
    this.mimeType = options?.mimeType ?? 'video/webm;codecs=vp9,opus';
    this.audioBitsPerSecond = options?.audioBitsPerSecond ?? 128000;
    this.videoBitsPerSecond = options?.videoBitsPerSecond ?? 2500000;
  }

  start(timeslice?: number): void {
    if ((this as { state: RecordingState }).state === 'recording') {
      throw new Error('InvalidStateError: Already recording');
    }

    (this as { state: RecordingState }).state = 'recording';
    this._timeslice = timeslice;

    const event = new Event('start');
    this.onstart?.(event);
    this._dispatchEvent('start', event);

    // If timeslice is provided, emit chunks at intervals
    if (timeslice && timeslice > 0) {
      this._intervalId = setInterval(() => {
        this._emitChunk();
      }, timeslice);
    }
  }

  stop(): void {
    if ((this as { state: RecordingState }).state !== 'recording') {
      throw new Error('InvalidStateError: Not recording');
    }

    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }

    // Emit final chunk
    this._emitChunk(true);

    (this as { state: RecordingState }).state = 'inactive';

    const event = new Event('stop');
    this.onstop?.(event);
    this._dispatchEvent('stop', event);
  }

  pause(): void {
    if ((this as { state: RecordingState }).state !== 'recording') {
      throw new Error('InvalidStateError: Not recording');
    }

    (this as { state: RecordingState }).state = 'paused';

    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }

    const event = new Event('pause');
    this.onpause?.(event);
    this._dispatchEvent('pause', event);
  }

  resume(): void {
    if ((this as { state: RecordingState }).state !== 'paused') {
      throw new Error('InvalidStateError: Not paused');
    }

    (this as { state: RecordingState }).state = 'recording';

    if (this._timeslice && this._timeslice > 0) {
      this._intervalId = setInterval(() => {
        this._emitChunk();
      }, this._timeslice);
    }

    const event = new Event('resume');
    this.onresume?.(event);
    this._dispatchEvent('resume', event);
  }

  requestData(): void {
    if ((this as { state: RecordingState }).state !== 'recording') {
      throw new Error('InvalidStateError: Not recording');
    }
    this._emitChunk();
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this._listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    return this._dispatchEvent(event.type, event);
  }

  private _dispatchEvent(type: string, event: Event): boolean {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
    return true;
  }

  private _emitChunk(_isFinal = false): void {
    this._chunkCounter++;

    // Create a mock blob with some data
    const mockData = new Uint8Array([
      0x1a,
      0x45,
      0xdf,
      0xa3, // EBML header
      ...Array(100).fill(this._chunkCounter % 256),
    ]);

    const blob = new Blob([mockData], { type: this.mimeType });

    const event = new BlobEvent('dataavailable', {
      data: blob,
      timecode: Date.now(),
    });

    this.ondataavailable?.(event);
    this._dispatchEvent('dataavailable', event);
  }

  // Static methods
  static isTypeSupported(mimeType: string): boolean {
    const supported = [
      'video/webm',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp9,opus',
      'audio/webm',
      'audio/webm;codecs=opus',
    ];
    return supported.some((s) => mimeType.startsWith(s.split(';')[0] ?? ''));
  }

  // Test helpers
  simulateError(message: string = 'Recording error'): void {
    const event = new ErrorEvent('error', { message });
    this.onerror?.(event);
    this._dispatchEvent('error', event);
  }

  simulateDataAvailable(data?: Blob): void {
    const blob = data ?? new Blob([new Uint8Array([1, 2, 3])], { type: this.mimeType });
    const event = new BlobEvent('dataavailable', { data: blob, timecode: Date.now() });
    this.ondataavailable?.(event);
    this._dispatchEvent('dataavailable', event);
  }

  getChunkCount(): number {
    return this._chunkCounter;
  }
}

// =============================================================================
// BlobEvent Polyfill (not available in jsdom)
// =============================================================================

if (typeof BlobEvent === 'undefined') {
  (globalThis as unknown as { BlobEvent: typeof BlobEvent }).BlobEvent = class BlobEvent
    extends Event
    implements BlobEvent
  {
    readonly data: Blob;
    readonly timecode: number;

    constructor(type: string, eventInitDict: BlobEventInit) {
      super(type, eventInitDict);
      this.data = eventInitDict.data;
      this.timecode = eventInitDict.timecode ?? 0;
    }
  } as typeof BlobEvent;
}

// =============================================================================
// Installation Helper
// =============================================================================

let originalMediaRecorder: typeof MediaRecorder | undefined;

export function installMockMediaRecorder(): void {
  originalMediaRecorder = globalThis.MediaRecorder;
  (globalThis as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder =
    MockMediaRecorder;
}

export function uninstallMockMediaRecorder(): void {
  if (originalMediaRecorder) {
    (globalThis as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder =
      originalMediaRecorder;
    originalMediaRecorder = undefined;
  }
}
