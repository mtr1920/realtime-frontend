---
title: "9. AI Interaction Layer"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 9. AI Interaction Layer

AI message types and session flows must match backend AI integration docs:
`/home/mtr/Projects/RealtimeApp/realtime-backend/development-process/plans/05-ai-integration/00-overview.md`.

### 7.1 Audio Capture Service

```typescript
// features/ai/services/audio-capture.service.ts
export class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onAudioChunk: ((chunk: ArrayBuffer) => void) | null = null;

  async start(
    deviceId: string,
    onAudioChunk: (chunk: ArrayBuffer) => void
  ): Promise<void> {
    this.onAudioChunk = onAudioChunk;

    // Get audio stream
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // Create audio context at 16kHz for Gemini
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    // Load audio worklet for processing
    await this.audioContext.audioWorklet.addModule('/audio-processor.worklet.js');

    // Create nodes
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

    // Handle audio chunks from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio-chunk') {
        this.onAudioChunk?.(event.data.buffer);
      }
    };

    // Connect: source -> worklet
    source.connect(this.workletNode);
  }

  stop(): void {
    this.workletNode?.disconnect();
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();

    this.workletNode = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.onAudioChunk = null;
  }

  setMuted(muted: boolean): void {
    this.workletNode?.port.postMessage({ type: 'set-muted', muted });
  }
}

// public/audio-processor.worklet.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096; // ~256ms at 16kHz
    this.muted = false;

    this.port.onmessage = (event) => {
      if (event.data.type === 'set-muted') {
        this.muted = event.data.muted;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || this.muted) return true;

    // Accumulate samples
    this.buffer.push(...input[0]);

    // Send chunk when buffer is full
    if (this.buffer.length >= this.bufferSize) {
      const samples = this.buffer.splice(0, this.bufferSize);
      const int16Array = this.float32ToInt16(samples);

      this.port.postMessage({
        type: 'audio-chunk',
        buffer: int16Array.buffer,
      }, [int16Array.buffer]);
    }

    return true;
  }

  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }
}

registerProcessor('audio-processor', AudioProcessor);
```

### 7.2 Audio Playback Service

```typescript
// features/ai/services/audio-playback.service.ts
export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  async initialize(): Promise<void> {
    // Create audio context at 24kHz for Gemini output
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async enqueueAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    // Convert PCM16 to AudioBuffer
    const int16Array = new Int16Array(audioData);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 0x7FFF;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    this.queue.push(audioBuffer);

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private playNext(): void {
    if (!this.audioContext || !this.gainNode || this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.gainNode);
    this.currentSource.onended = () => this.playNext();
    this.currentSource.start();
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  interrupt(): void {
    this.queue = [];
    this.currentSource?.stop();
    this.currentSource = null;
    this.isPlaying = false;
  }

  close(): void {
    this.interrupt();
    this.audioContext?.close();
    this.audioContext = null;
    this.gainNode = null;
  }
}
```

### 7.3 AI Session Hook

```typescript
// features/ai/hooks/useAISession.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AudioCaptureService } from '../services/audio-capture.service';
import { AudioPlaybackService } from '../services/audio-playback.service';
import { useSessionConfig } from '@/features/session/hooks/useSessionConfig';

export type AISessionState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export function useAISession() {
  const { send, subscribe } = useWebSocket();
  const { config } = useSessionConfig();
  const [state, setState] = useState<AISessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const captureRef = useRef<AudioCaptureService | null>(null);
  const playbackRef = useRef<AudioPlaybackService | null>(null);
  const isSpeakingRef = useRef(false);

  // Initialize services
  useEffect(() => {
    captureRef.current = new AudioCaptureService();
    playbackRef.current = new AudioPlaybackService();
    playbackRef.current.initialize();

    return () => {
      captureRef.current?.stop();
      playbackRef.current?.close();
    };
  }, []);

  // Subscribe to AI messages
  useEffect(() => {
    const unsubscribers = [
      subscribe('ai.session.started', () => {
        setState('listening');
      }),

      subscribe('ai.output.audio.chunk', (msg) => {
        playbackRef.current?.enqueueAudio(msg.payload.audioData);
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setState('speaking');
        }
      }),

      subscribe('ai.output.text.delta', (msg) => {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'ai' && !last.isFinal) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + msg.payload.text },
            ];
          }
          return [...prev, { role: 'ai', content: msg.payload.text, isFinal: false }];
        });
      }),

      subscribe('ai.output.text.complete', (msg) => {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'ai') {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
        isSpeakingRef.current = false;
        setState('listening');
      }),

      subscribe('ai.turn.end', () => {
        setState('processing');
      }),

      subscribe('ai.error', (msg) => {
        setError(msg.payload.message);
        setState('error');
      }),

      subscribe('ai.provider.switched', (msg) => {
        console.log('AI provider switched:', msg.payload);
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [subscribe]);

  const startSession = useCallback(async (deviceId: string) => {
    if (!config?.modules.ai?.enabled) {
      throw new Error('AI module not enabled');
    }

    setState('starting');
    setError(null);

    try {
      // Start audio capture
      await captureRef.current?.start(deviceId, (chunk) => {
        send('ai.input.audio.append', { audioData: chunk });
      });

      // Request AI session start
      send('ai.session.start', {});
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to start AI session');
    }
  }, [config, send]);

  const endSession = useCallback(() => {
    captureRef.current?.stop();
    playbackRef.current?.interrupt();
    setState('idle');
  }, []);

  const startSpeaking = useCallback(() => {
    if (state === 'listening') {
      playbackRef.current?.interrupt(); // Interrupt AI if speaking
      send('ai.turn.start', {});
    }
  }, [state, send]);

  const stopSpeaking = useCallback(() => {
    send('ai.turn.end', {});
    setState('processing');
  }, [send]);

  const setMuted = useCallback((muted: boolean) => {
    captureRef.current?.setMuted(muted);
  }, []);

  return {
    state,
    transcript,
    error,
    startSession,
    endSession,
    startSpeaking,
    stopSpeaking,
    setMuted,
    isActive: state !== 'idle' && state !== 'error',
  };
}
```

### 7.4 AI Actor Profiles (Role-Driven)

AI actor profiles are configured per domain (interview, pre-sales, people management, support) and should not be hardcoded to a single use case.

```typescript
// features/ai/actors/actor.types.ts
export interface AIActorProfile {
  id: string;
  roleId: string; // interviewer, pre-sales-manager, people-manager, etc.
  displayName: string;
  personaPrompt: string;
  voice: {
    provider: string;
    voiceId: string;
    speakingRate?: number;
  };
  avatar: {
    imageUrl?: string;
    videoUrl?: string;
  };
  capabilities: {
    canAskQuestions: boolean;
    canScoreResponses: boolean;
    canSummarize: boolean;
  };
}

// features/ai/hooks/useActiveAIActor.ts
import { useSessionConfig } from '@/features/session/hooks/useSessionConfig';

export function useActiveAIActor() {
  const { config } = useSessionConfig();
  const actors = config?.modules.ai?.actors ?? [];
  const activeId = config?.modules.ai?.activeActorId;
  return actors.find((actor) => actor.id === activeId) ?? actors[0];
}
```

### 7.5 Audio Routing for Recording Mix

```typescript
// features/ai/services/audio-playback.service.ts
export class AudioPlaybackService {
  // ...existing fields...

  connectOutput(node: AudioNode): void {
    if (this.gainNode) {
      this.gainNode.connect(node);
    }
  }
}
```

The playback service must optionally connect to the recording mixer so AI avatar audio is captured in screen recordings.

---
