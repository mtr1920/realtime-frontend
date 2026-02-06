---
name: webrtc-media
description: Use when implementing WebRTC, peer connections, media capture, or video streaming
---

# WebRTC Media Patterns

Peer connections, media capture, signaling, and streaming patterns.

## Overview

This skill covers RTCPeerConnection management, media device handling, signaling integration, and the service layer architecture for WebRTC.

---

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  MediaCapture    │────▶│   WebRTC         │────▶│   Remote         │
│  Service         │     │   Service        │     │   Streams        │
│  (getUserMedia)  │     │  (PeerConnection)│     │   (VideoTile)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │                        │
         │                        │ signaling
         │                        ▼
         │               ┌──────────────────┐
         │               │   WebSocket      │
         │               │   (Signaling)    │
         │               └──────────────────┘
         │
         ▼
┌──────────────────┐
│   Media Store    │
│   (Zustand)      │
└──────────────────┘
```

---

## Media Capture Service

```typescript
// ✅ CORRECT - Media capture service
// features/media/services/media-capture.service.ts

interface CaptureOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

class MediaCaptureService {
  private stream: MediaStream | null = null;

  async startCapture(options: CaptureOptions = {}): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: options.video ?? {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: options.audio ?? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: 'always',
        },
        audio: true, // System audio
      });
    } catch (error) {
      throw this.mapError(error);
    }
  }

  stopCapture(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  async switchDevice(kind: 'videoinput' | 'audioinput', deviceId: string): Promise<void> {
    if (!this.stream) return;

    const constraints = kind === 'videoinput'
      ? { video: { deviceId: { exact: deviceId } } }
      : { audio: { deviceId: { exact: deviceId } } };

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newTrack = newStream.getTracks()[0];
    const oldTrack = kind === 'videoinput'
      ? this.stream.getVideoTracks()[0]
      : this.stream.getAudioTracks()[0];

    // Replace track in stream
    this.stream.removeTrack(oldTrack);
    this.stream.addTrack(newTrack);
    oldTrack.stop();

    // Notify peer connections
    this.onTrackReplaced?.(oldTrack, newTrack);
  }

  private mapError(error: unknown): MediaError {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          return new MediaError('permission_denied', 'Camera/microphone access denied');
        case 'NotFoundError':
          return new MediaError('device_not_found', 'No camera or microphone found');
        case 'NotReadableError':
          return new MediaError('device_in_use', 'Camera or microphone is in use');
        case 'OverconstrainedError':
          return new MediaError('constraints_error', 'Requested constraints cannot be met');
        default:
          return new MediaError('unknown', error.message);
      }
    }
    return new MediaError('unknown', String(error));
  }

  // Callback for track replacement
  onTrackReplaced?: (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack) => void;
}

export const mediaCaptureService = new MediaCaptureService();
```

---

## Peer Connection Management

```typescript
// ✅ CORRECT - Peer connection wrapper
// features/media/services/peer-connection.ts

interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack: (event: RTCTrackEvent) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

class PeerConnectionManager {
  private pc: RTCPeerConnection;
  private config: PeerConnectionConfig;

  constructor(config: PeerConnectionConfig) {
    this.config = config;
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        config.onIceCandidate(event.candidate);
      }
    };

    this.pc.ontrack = config.onTrack;
    this.pc.onconnectionstatechange = () => {
      config.onConnectionStateChange(this.pc.connectionState);
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender {
    return this.pc.addTrack(track, stream);
  }

  replaceTrack(sender: RTCRtpSender, track: MediaStreamTrack): Promise<void> {
    return sender.replaceTrack(track);
  }

  getSenders(): RTCRtpSender[] {
    return this.pc.getSenders();
  }

  close(): void {
    this.pc.close();
  }

  get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }
}
```

---

## Signaling Adapter

```typescript
// ✅ CORRECT - Adapter between WebRTC and WebSocket
// features/media/services/signaling-adapter.ts

class SignalingAdapter {
  constructor(
    private send: <T extends ClientMessageType>(type: T, payload: ClientMessagePayloads[T]) => void,
    private subscribe: <T extends ServerMessageType>(type: T, handler: MessageHandler<T>) => () => void
  ) {}

  sendOffer(targetParticipantId: string, offer: RTCSessionDescriptionInit): void {
    this.send('webrtc.offer', {
      targetParticipantId,
      sdp: offer.sdp!,
      type: offer.type,
    });
  }

  sendAnswer(targetParticipantId: string, answer: RTCSessionDescriptionInit): void {
    this.send('webrtc.answer', {
      targetParticipantId,
      sdp: answer.sdp!,
      type: answer.type,
    });
  }

  sendIceCandidate(targetParticipantId: string, candidate: RTCIceCandidate): void {
    this.send('webrtc.ice-candidate', {
      targetParticipantId,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    });
  }

  onOffer(handler: (fromId: string, offer: RTCSessionDescriptionInit) => void): () => void {
    return this.subscribe('webrtc.offer', (payload) => {
      handler(payload.fromParticipantId, {
        type: payload.type as RTCSdpType,
        sdp: payload.sdp,
      });
    });
  }

  onAnswer(handler: (fromId: string, answer: RTCSessionDescriptionInit) => void): () => void {
    return this.subscribe('webrtc.answer', (payload) => {
      handler(payload.fromParticipantId, {
        type: payload.type as RTCSdpType,
        sdp: payload.sdp,
      });
    });
  }

  onIceCandidate(handler: (fromId: string, candidate: RTCIceCandidateInit) => void): () => void {
    return this.subscribe('webrtc.ice-candidate', (payload) => {
      handler(payload.fromParticipantId, {
        candidate: payload.candidate,
        sdpMid: payload.sdpMid,
        sdpMLineIndex: payload.sdpMLineIndex,
      });
    });
  }
}
```

---

## useLocalMedia Hook

```typescript
// ✅ CORRECT - Local media hook
// features/media/hooks/useLocalMedia.ts

interface UseLocalMediaOptions {
  autoStart?: boolean;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

export function useLocalMedia(options: UseLocalMediaOptions = {}) {
  const { autoStart = false, videoEnabled = true, audioEnabled = true } = options;

  const localStream = useMediaStore((s) => s.localStream);
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const [error, setError] = useState<MediaError | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCapture = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setError(null);

    try {
      const stream = await mediaCaptureService.startCapture({
        video: videoEnabled,
        audio: audioEnabled,
      });
      setLocalStream(stream);
    } catch (err) {
      setError(err as MediaError);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, videoEnabled, audioEnabled, setLocalStream]);

  const stopCapture = useCallback(() => {
    mediaCaptureService.stopCapture();
    setLocalStream(null);
  }, [setLocalStream]);

  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  // Auto-start
  useEffect(() => {
    if (autoStart && !localStream) {
      startCapture();
    }
  }, [autoStart, localStream, startCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaCaptureService.stopCapture();
    };
  }, []);

  return {
    localStream,
    isCapturing,
    error,
    startCapture,
    stopCapture,
    toggleAudio,
    toggleVideo,
    isAudioEnabled: localStream?.getAudioTracks()[0]?.enabled ?? false,
    isVideoEnabled: localStream?.getVideoTracks()[0]?.enabled ?? false,
  };
}
```

---

## useMediaDevices Hook

```typescript
// ✅ CORRECT - Device enumeration hook
// features/media/hooks/useMediaDevices.ts

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string | null>(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(allDevices);
  }, []);

  useEffect(() => {
    refreshDevices();

    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  const audioInputs = useMemo(
    () => devices.filter((d) => d.kind === 'audioinput'),
    [devices]
  );

  const videoInputs = useMemo(
    () => devices.filter((d) => d.kind === 'videoinput'),
    [devices]
  );

  const audioOutputs = useMemo(
    () => devices.filter((d) => d.kind === 'audiooutput'),
    [devices]
  );

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    setSelectedAudioInput,
    selectedVideoInput,
    setSelectedVideoInput,
    refreshDevices,
  };
}
```

---

## Video Component

```typescript
// ✅ CORRECT - Video element with stream
// features/media/components/VideoTile.tsx

interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  participantName?: string;
  isLocal?: boolean;
}

export function VideoTile({
  stream,
  muted = false,
  mirror = false,
  participantName,
  isLocal = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-muted">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted || isLocal} // Local video always muted to prevent feedback
        className={cn(
          'h-full w-full object-cover',
          mirror && 'scale-x-[-1]' // Mirror local video
        )}
      />

      {/* Name overlay */}
      {participantName && (
        <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">
          {participantName}
          {isLocal && ' (You)'}
        </div>
      )}

      {/* No video placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
```

---

## Screen Share Hook

```typescript
// ✅ CORRECT - Screen share with enforcement
// features/media/hooks/useScreenShare.ts

export function useScreenShare() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<MediaError | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await mediaCaptureService.startScreenShare();

      // Listen for user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsSharing(false);
      };

      setScreenStream(stream);
      setIsSharing(true);
    } catch (err) {
      setError(err as MediaError);
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsSharing(false);
  }, [screenStream]);

  return {
    screenStream,
    isSharing,
    error,
    startScreenShare,
    stopScreenShare,
  };
}
```

---

## Audio Level Analysis

```typescript
// ✅ CORRECT - Audio level monitoring
// features/media/hooks/useAudioLevels.ts

export function useAudioLevels(stream: MediaStream | null) {
  const [audioLevel, setAudioLevel] = useState(0);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();

    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzerRef.current = analyzer;

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    const updateLevel = () => {
      analyzer.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [stream]);

  const isSpeaking = audioLevel > 0.1; // Threshold

  return { audioLevel, isSpeaking };
}
```

---

## Critical Rules

1. **Service layer for WebRTC** - not raw API in components
2. **Signaling via WebSocket** - adapter pattern for separation
3. **Always cleanup tracks** - stop tracks on unmount
4. **Handle device changes** - devicechange event listener
5. **Mirror local video** - scale-x-[-1] for natural appearance
6. **Mute local playback** - prevent audio feedback
7. **Track ended listener** - for browser stop share UI
8. **Store for stream state** - Zustand, not local state

---

## Related Skills

- `websocket-client` - Signaling transport
- `zustand-state-management` - Media state
- `media-services-patterns` - Recording integration
