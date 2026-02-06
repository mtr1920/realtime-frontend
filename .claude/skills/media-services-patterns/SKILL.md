---
name: media-services-patterns
description: Use when implementing audio/video services, AudioWorklet, MediaRecorder, or streaming services
---

# Media Services Patterns

AudioWorklet, MediaRecorder, and streaming service patterns.

## Overview

This skill covers advanced media services including audio processing with AudioWorklet, recording with MediaRecorder, and stream management.

---

## Audio Capture Service

```typescript
// CORRECT - Audio capture with AudioWorklet
// features/ai/services/audio-capture.service.ts

interface AudioCaptureConfig {
  sampleRate?: number;
  channelCount?: number;
  onAudioData?: (data: Float32Array) => void;
  onError?: (error: Error) => void;
}

class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  async start(stream: MediaStream, config: AudioCaptureConfig = {}): Promise<void> {
    const { sampleRate = 16000, channelCount = 1, onAudioData, onError } = config;

    try {
      // Create audio context
      this.audioContext = new AudioContext({ sampleRate });

      // Load worklet processor
      await this.audioContext.audioWorklet.addModule('/audio-processor.worklet.js');

      // Create source from stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor', {
        channelCount,
        processorOptions: { bufferSize: 4096 },
      });

      // Handle audio data from worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          onAudioData?.(event.data.buffer);
        }
      };

      // Connect nodes
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  stop(): void {
    this.workletNode?.disconnect();
    this.sourceNode?.disconnect();
    this.audioContext?.close();

    this.workletNode = null;
    this.sourceNode = null;
    this.audioContext = null;
  }

  get isCapturing(): boolean {
    return this.audioContext?.state === 'running';
  }
}

export const audioCaptureService = new AudioCaptureService();
```

### AudioWorklet Processor

```javascript
// public/audio-processor.worklet.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = options.processorOptions?.bufferSize ?? 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];

    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.bufferIndex++] = samples[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Send buffer to main thread
        this.port.postMessage({
          type: 'audio',
          buffer: this.buffer.slice(),
        });
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
```

---

## Audio Playback Service

```typescript
// CORRECT - Audio playback service
// features/ai/services/audio-playback.service.ts

interface AudioPlaybackConfig {
  sampleRate?: number;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  async initialize(config: AudioPlaybackConfig = {}): Promise<void> {
    const { sampleRate = 24000 } = config;

    this.audioContext = new AudioContext({ sampleRate });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async enqueue(audioData: ArrayBuffer | Float32Array): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioPlaybackService not initialized');
    }

    // Convert to AudioBuffer
    const buffer = await this.createAudioBuffer(audioData);
    this.queue.push(buffer);

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async createAudioBuffer(data: ArrayBuffer | Float32Array): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('No audio context');

    if (data instanceof Float32Array) {
      const buffer = this.audioContext.createBuffer(1, data.length, this.audioContext.sampleRate);
      buffer.getChannelData(0).set(data);
      return buffer;
    }

    // Decode from ArrayBuffer (e.g., PCM16)
    return this.audioContext.decodeAudioData(data);
  }

  private playNext(): void {
    if (!this.audioContext || !this.gainNode || this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    source.onended = () => {
      this.currentSource = null;
      this.playNext();
    };

    this.currentSource = source;
    source.start();
  }

  stop(): void {
    this.currentSource?.stop();
    this.currentSource = null;
    this.queue = [];
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  cleanup(): void {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
    this.gainNode = null;
  }
}

export const audioPlaybackService = new AudioPlaybackService();
```

---

## Recording Mixer Service

```typescript
// CORRECT - Mix multiple streams for recording
// features/recording/services/recording-mixer.service.ts

interface MixerConfig {
  width?: number;
  height?: number;
  frameRate?: number;
}

class RecordingMixerService {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private audioContext: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private animationFrame: number | null = null;

  initialize(config: MixerConfig = {}): MediaStream {
    const { width = 1920, height = 1080, frameRate = 30 } = config;

    // Setup canvas for video mixing
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;

    // Setup audio mixing
    this.audioContext = new AudioContext();
    this.audioDestination = this.audioContext.createMediaStreamDestination();

    // Create combined stream
    const videoStream = this.canvas.captureStream(frameRate);
    const audioTrack = this.audioDestination.stream.getAudioTracks()[0];

    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      audioTrack,
    ]);

    return combinedStream;
  }

  addVideoSource(video: HTMLVideoElement, position: { x: number; y: number; w: number; h: number }): void {
    if (!this.ctx || !this.canvas) return;

    const draw = () => {
      this.ctx!.drawImage(video, position.x, position.y, position.w, position.h);
      this.animationFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  addAudioSource(stream: MediaStream): void {
    if (!this.audioContext || !this.audioDestination) return;

    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.audioDestination);
  }

  cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.audioContext?.close();
    this.canvas = null;
    this.ctx = null;
    this.audioContext = null;
    this.audioDestination = null;
  }
}

export const recordingMixerService = new RecordingMixerService();
```

---

## Recording Stream Service

```typescript
// CORRECT - MediaRecorder wrapper
// features/recording/services/recording-stream.service.ts

interface RecordingConfig {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  timeslice?: number;
  onDataAvailable?: (data: Blob) => void;
  onError?: (error: Error) => void;
}

class RecordingStreamService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];

    return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'video/webm';
  }

  start(stream: MediaStream, config: RecordingConfig = {}): void {
    const {
      mimeType = this.getSupportedMimeType(),
      videoBitsPerSecond = 2_500_000,
      audioBitsPerSecond = 128_000,
      timeslice = 1000,
      onDataAvailable,
      onError,
    } = config;

    this.chunks = [];

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        onError?.(new Error(event.error?.message ?? 'Recording error'));
      };

      this.mediaRecorder.start(timeslice);
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  stop(): Blob | null {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder!.mimeType });
        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder!.stop();
    });
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  get state(): RecordingState {
    return this.mediaRecorder?.state ?? 'inactive';
  }
}

export const recordingStreamService = new RecordingStreamService();
```

---

## Recording Upload Service

```typescript
// CORRECT - Chunked upload for recordings
// features/recording/services/recording-upload.service.ts

interface UploadConfig {
  chunkSize?: number;
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

class RecordingUploadService {
  async uploadRecording(
    blob: Blob,
    sessionId: string,
    config: UploadConfig = {}
  ): Promise<string> {
    const { chunkSize = 5 * 1024 * 1024, onProgress, onError } = config;

    try {
      // Initialize multipart upload
      const { uploadId, uploadUrl } = await this.initializeUpload(sessionId, blob.size);

      // Upload chunks
      const chunks = Math.ceil(blob.size / chunkSize);
      const etags: string[] = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunk = blob.slice(start, end);

        const etag = await this.uploadChunk(uploadUrl, chunk, i + 1);
        etags.push(etag);

        onProgress?.(((i + 1) / chunks) * 100);
      }

      // Complete upload
      const recordingUrl = await this.completeUpload(uploadId, etags);
      return recordingUrl;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }

  private async initializeUpload(sessionId: string, size: number) {
    const response = await apiClient.post<{ uploadId: string; uploadUrl: string }>(
      `/v1/sessions/${sessionId}/recordings/init`,
      { size }
    );
    return response;
  }

  private async uploadChunk(url: string, chunk: Blob, partNumber: number): Promise<string> {
    const response = await fetch(`${url}?partNumber=${partNumber}`, {
      method: 'PUT',
      body: chunk,
    });
    return response.headers.get('ETag') ?? '';
  }

  private async completeUpload(uploadId: string, etags: string[]): Promise<string> {
    const response = await apiClient.post<{ url: string }>(
      `/v1/recordings/${uploadId}/complete`,
      { etags }
    );
    return response.url;
  }
}

export const recordingUploadService = new RecordingUploadService();
```

---

## Critical Rules

1. **AudioWorklet for processing** - not ScriptProcessorNode (deprecated)
2. **OffscreenCanvas for mixing** - better performance
3. **Check MIME type support** - MediaRecorder.isTypeSupported()
4. **Cleanup all resources** - close contexts, disconnect nodes
5. **Handle errors gracefully** - DOMException, NotSupportedError
6. **Use appropriate bitrates** - balance quality vs file size
7. **Chunked upload** - for large recordings
8. **Queue for playback** - prevent gaps in audio

---

## Related Skills

- `webrtc-media` - Media capture and streaming
- `websocket-client` - Real-time audio streaming
- `error-handling` - Service error handling
