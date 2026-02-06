---
title: "8. WebRTC Integration"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 8. WebRTC Integration

### 6.1 WebRTC Service

```typescript
// services/webrtc.service.ts
import { Device } from 'mediasoup-client';
import type { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';

interface WebRTCServiceConfig {
  signaling: {
    send: <T>(type: string, payload: T) => string;
    subscribe: (type: string, handler: (msg: any) => void) => () => void;
  };
}

export class WebRTCService {
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producers = new Map<string, Producer>();
  private consumers = new Map<string, Consumer>();
  private config: WebRTCServiceConfig;

  constructor(config: WebRTCServiceConfig) {
    this.config = config;
  }

  async initialize(routerRtpCapabilities: any): Promise<void> {
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities });
  }

  async createSendTransport(transportOptions: any): Promise<void> {
    if (!this.device) throw new Error('Device not initialized');

    this.sendTransport = this.device.createSendTransport(transportOptions);

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        this.config.signaling.send('rtc.transport.connect', {
          transportId: this.sendTransport!.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const messageId = this.config.signaling.send('rtc.producer.create', {
          transportId: this.sendTransport!.id,
          kind,
          rtpParameters,
        });

        // Wait for response with producerId
        const unsubscribe = this.config.signaling.subscribe('rtc.producer.created', (msg) => {
          if (msg.payload.requestId === messageId) {
            callback({ id: msg.payload.producerId });
            unsubscribe();
          }
        });
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  async createRecvTransport(transportOptions: any): Promise<void> {
    if (!this.device) throw new Error('Device not initialized');

    this.recvTransport = this.device.createRecvTransport(transportOptions);

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        this.config.signaling.send('rtc.transport.connect', {
          transportId: this.recvTransport!.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error as Error);
      }
    });
  }

  async publishTrack(track: MediaStreamTrack): Promise<string> {
    if (!this.sendTransport) throw new Error('Send transport not created');

    const producer = await this.sendTransport.produce({ track });
    this.producers.set(producer.id, producer);

    return producer.id;
  }

  async unpublishTrack(producerId: string): Promise<void> {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
      this.config.signaling.send('rtc.producer.close', { producerId });
    }
  }

  async consumeTrack(consumerOptions: any): Promise<MediaStreamTrack> {
    if (!this.recvTransport) throw new Error('Recv transport not created');

    const consumer = await this.recvTransport.consume(consumerOptions);
    this.consumers.set(consumer.id, consumer);

    // Resume consumer
    this.config.signaling.send('rtc.consumer.resume', { consumerId: consumer.id });

    return consumer.track;
  }

  async stopConsuming(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  close(): void {
    this.producers.forEach((p) => p.close());
    this.consumers.forEach((c) => c.close());
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.producers.clear();
    this.consumers.clear();
    this.sendTransport = null;
    this.recvTransport = null;
  }
}
```

### 6.2 Media Device Hook

```typescript
// features/media/hooks/useMediaDevices.ts
import { useState, useEffect, useCallback } from 'react';

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
}

interface UseMediaDevicesResult {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  selectedVideoInput: string | null;
  setSelectedAudioInput: (id: string) => void;
  setSelectedAudioOutput: (id: string) => void;
  setSelectedVideoInput: (id: string) => void;
  refreshDevices: () => Promise<void>;
  hasPermissions: boolean;
  requestPermissions: () => Promise<boolean>;
}

export function useMediaDevices(): UseMediaDevicesResult {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string | null>(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string | null>(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const formattedDevices = deviceList
        .filter((d) => d.kind !== 'audiooutput' || 'setSinkId' in HTMLMediaElement.prototype)
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `${d.kind} (${d.deviceId.slice(0, 8)})`,
          kind: d.kind as MediaDeviceInfo['kind'],
        }));

      setDevices(formattedDevices);
      setHasPermissions(formattedDevices.some((d) => d.label !== ''));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());

      setHasPermissions(true);
      await refreshDevices();
      return true;
    } catch (error) {
      console.error('Failed to get permissions:', error);
      return false;
    }
  }, [refreshDevices]);

  useEffect(() => {
    refreshDevices();

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Auto-select default devices
  useEffect(() => {
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');
    const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

    if (!selectedAudioInput && audioInputs.length > 0) {
      setSelectedAudioInput(audioInputs[0].deviceId);
    }
    if (!selectedVideoInput && videoInputs.length > 0) {
      setSelectedVideoInput(videoInputs[0].deviceId);
    }
    if (!selectedAudioOutput && audioOutputs.length > 0) {
      setSelectedAudioOutput(audioOutputs[0].deviceId);
    }
  }, [devices, selectedAudioInput, selectedVideoInput, selectedAudioOutput]);

  return {
    audioInputs: devices.filter((d) => d.kind === 'audioinput'),
    audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
    videoInputs: devices.filter((d) => d.kind === 'videoinput'),
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
    refreshDevices,
    hasPermissions,
    requestPermissions,
  };
}
```

### 6.3 Screen Recording + AI Audio Mix

```typescript
// features/recording/services/recording-mixer.ts
export class RecordingMixer {
  private context = new AudioContext();
  private destination = this.context.createMediaStreamDestination();
  private micSource: MediaStreamAudioSourceNode | null = null;
  private aiSource: MediaElementAudioSourceNode | null = null;

  connectMic(stream: MediaStream): void {
    this.micSource?.disconnect();
    this.micSource = this.context.createMediaStreamSource(stream);
    this.micSource.connect(this.destination);
  }

  connectAI(element: HTMLAudioElement): void {
    this.aiSource?.disconnect();
    this.aiSource = this.context.createMediaElementSource(element);
    this.aiSource.connect(this.destination);
  }

  getMixedStream(): MediaStream {
    return this.destination.stream;
  }

  close(): void {
    this.micSource?.disconnect();
    this.aiSource?.disconnect();
    this.context.close();
  }
}

// features/recording/services/recording-stream.ts
export async function createRecordingStream(options: {
  screenStream: MediaStream;
  micStream: MediaStream;
  aiAudioElement?: HTMLAudioElement;
  onScreenShareEnded?: () => void;
}): Promise<MediaStream> {
  const mixer = new RecordingMixer();
  mixer.connectMic(options.micStream);
  if (options.aiAudioElement) {
    mixer.connectAI(options.aiAudioElement);
  }

  const stream = new MediaStream();
  options.screenStream.getVideoTracks().forEach((track) => {
    track.addEventListener('ended', () => options.onScreenShareEnded?.());
    stream.addTrack(track);
  });
  mixer.getMixedStream().getAudioTracks().forEach((track) => stream.addTrack(track));

  return stream;
}
```

Use `MediaRecorder` to chunk and upload recordings to the backend. If screen sharing ends, fall back to camera recording and keep the mixed audio stream active.

---
