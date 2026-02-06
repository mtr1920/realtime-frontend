# AI Client Integration

## Overview

The frontend handles voice interaction with AI actors through audio capture, playback, and WebSocket messaging. Audio is processed using Web Audio API and AudioWorklet.

## Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Microphone     │────▶│ AudioCapture    │────▶│ WebSocket:   │
│                │     │ Service         │     │ ai.input.*   │
└────────────────┘     └─────────────────┘     └──────────────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │ Backend AI   │
                                               │ Router       │
                                               └──────────────┘
                                                      │
                                                      ▼
┌────────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Speakers       │◀────│ AudioPlayback   │◀────│ WebSocket:   │
│                │     │ Service         │     │ ai.output.*  │
└────────────────┘     └─────────────────┘     └──────────────┘
```

## Audio Capture Service

Captures microphone audio at 16kHz for AI processing:

```typescript
// features/ai/services/audio-capture.service.ts
class AudioCaptureService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;

  async start(deviceId: string, onAudioChunk: (chunk: ArrayBuffer) => void) {
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

    // Create audio context at 16kHz
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    // Load audio worklet
    await this.audioContext.audioWorklet.addModule('/audio-processor.worklet.js');

    // Create nodes
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

    // Handle audio chunks
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audio-chunk') {
        onAudioChunk(event.data.buffer);
      }
    };

    source.connect(this.workletNode);
  }

  setMuted(muted: boolean) {
    this.workletNode?.port.postMessage({ type: 'set-muted', muted });
  }

  stop() {
    this.workletNode?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
  }
}
```

## Audio Playback Service

Plays AI audio responses at 24kHz:

```typescript
// features/ai/services/audio-playback.service.ts
class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;

  async initialize() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async enqueueAudio(audioData: ArrayBuffer) {
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
    if (!this.isPlaying) this.playNext();
  }

  private playNext() {
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

  interrupt() {
    this.queue = [];
    this.currentSource?.stop();
    this.currentSource = null;
    this.isPlaying = false;
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Connect to recording mixer
  connectOutput(node: AudioNode) {
    this.gainNode?.connect(node);
  }

  close() {
    this.interrupt();
    this.audioContext?.close();
  }
}
```

## AI Session Hook

Main hook for AI interaction:

```typescript
// features/ai/hooks/useAISession.ts
type AISessionState = 'idle' | 'starting' | 'listening' | 'processing' | 'speaking' | 'error';

function useAISession() {
  const { emit, subscribe } = useWebSocket();
  const { isModuleEnabled } = useSessionConfig();
  const [state, setState] = useState<AISessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const captureRef = useRef<AudioCaptureService | null>(null);
  const playbackRef = useRef<AudioPlaybackService | null>(null);

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
      subscribe('ai.session.started', () => setState('listening')),

      subscribe('ai.output.audio.chunk', (msg) => {
        playbackRef.current?.enqueueAudio(msg.payload.audioData);
        setState('speaking');
      }),

      subscribe('ai.output.text.delta', (msg) => {
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'ai' && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, content: last.content + msg.payload.text }];
          }
          return [...prev, { role: 'ai', content: msg.payload.text, isFinal: false }];
        });
      }),

      subscribe('ai.output.text.complete', () => {
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'ai') {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
        setState('listening');
      }),

      subscribe('ai.error', (msg) => {
        setState('error');
        toast.error(msg.payload.message);
      }),
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe]);

  const startSession = async (deviceId: string) => {
    if (!isModuleEnabled('ai')) throw new Error('AI not enabled');

    setState('starting');
    await captureRef.current?.start(deviceId, (chunk) => {
      emit('ai.input.audio.append', { audioData: chunk });
    });
    emit('ai.session.start', {});
  };

  const endSession = () => {
    captureRef.current?.stop();
    playbackRef.current?.interrupt();
    setState('idle');
  };

  const startSpeaking = () => {
    playbackRef.current?.interrupt();
    emit('ai.turn.start', {});
  };

  const stopSpeaking = () => {
    emit('ai.turn.end', {});
    setState('processing');
  };

  return {
    state,
    transcript,
    startSession,
    endSession,
    startSpeaking,
    stopSpeaking,
    setMuted: (muted: boolean) => captureRef.current?.setMuted(muted),
    isActive: state !== 'idle' && state !== 'error',
  };
}
```

## AI Actor Hook

Access configured AI actor:

```typescript
// features/ai/hooks/useActiveAIActor.ts
function useActiveAIActor() {
  const { config } = useSessionConfig();

  const actors = config?.modules.ai?.actors ?? [];
  const activeId = config?.modules.ai?.activeActorId;

  return actors.find(a => a.id === activeId) ?? actors[0];
}

// Usage
function AIAvatar() {
  const actor = useActiveAIActor();

  return (
    <div>
      <Avatar src={actor?.avatar.imageUrl} />
      <span>{actor?.displayName}</span>
    </div>
  );
}
```

## Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `ai.session.start` | C→S | Start AI session |
| `ai.session.started` | S→C | Session started |
| `ai.input.audio.append` | C→S | Audio chunk (PCM16) |
| `ai.turn.start` | C→S | User starts speaking |
| `ai.turn.end` | C→S | User stops speaking |
| `ai.output.audio.chunk` | S→C | AI audio (PCM16) |
| `ai.output.text.delta` | S→C | Partial transcript |
| `ai.output.text.complete` | S→C | Final transcript |
| `ai.error` | S→C | Error message |
| `ai.provider.switched` | S→C | Provider failover |

## Audio Worklet

```javascript
// public/audio-processor.worklet.js
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096; // ~256ms at 16kHz
    this.muted = false;

    this.port.onmessage = (e) => {
      if (e.data.type === 'set-muted') this.muted = e.data.muted;
    };
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || this.muted) return true;

    this.buffer.push(...input);

    if (this.buffer.length >= this.bufferSize) {
      const samples = this.buffer.splice(0, this.bufferSize);
      const int16 = this.float32ToInt16(samples);
      this.port.postMessage({ type: 'audio-chunk', buffer: int16.buffer }, [int16.buffer]);
    }

    return true;
  }

  float32ToInt16(float32) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }
}

registerProcessor('audio-processor', AudioProcessor);
```

## Related Documentation

- [Data Flows](../model/data-flows.md)
- [WebSocket Client](./websocket-client.md)
- [Config Rendering](../model/config-rendering.md)
