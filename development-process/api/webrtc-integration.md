# WebRTC Integration

## Overview

The frontend uses WebRTC for real-time media communication. The current architecture uses P2P mesh; future phases may add SFU (mediasoup) for larger sessions.

## Architecture

```
┌─────────────┐     Signaling     ┌─────────────┐
│  Peer A     │◄─────────────────▶│  Peer B     │
│  (Browser)  │                   │  (Browser)  │
└──────┬──────┘                   └──────┬──────┘
       │                                  │
       │        Media (P2P)               │
       └──────────────────────────────────┘
```

## Device Management

### Device Enumeration

```typescript
// features/media/hooks/useMediaDevices.ts
function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasPermissions, setHasPermissions] = useState(false);

  const refreshDevices = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(mediaDevices);
  };

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setHasPermissions(true);
      await refreshDevices();
    } catch (error) {
      setHasPermissions(false);
    }
  };

  return {
    audioInputs: devices.filter(d => d.kind === 'audioinput'),
    videoInputs: devices.filter(d => d.kind === 'videoinput'),
    audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
    hasPermissions,
    requestPermissions,
    refreshDevices,
  };
}
```

### Device Selection

```typescript
// features/media/components/DeviceSelector.tsx
function DeviceSelector({
  kind,
  value,
  onChange,
}: {
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
  value: string | null;
  onChange: (deviceId: string) => void;
}) {
  const { audioInputs, videoInputs, audioOutputs } = useMediaDevices();

  const devices = {
    audioinput: audioInputs,
    videoinput: videoInputs,
    audiooutput: audioOutputs,
  }[kind];

  return (
    <Select value={value ?? ''} onValueChange={onChange}>
      {devices.map(device => (
        <SelectItem key={device.deviceId} value={device.deviceId}>
          {device.label || `${kind} ${device.deviceId.slice(0, 8)}`}
        </SelectItem>
      ))}
    </Select>
  );
}
```

## Local Stream Management

### Getting User Media

```typescript
async function getUserMedia(constraints: MediaStreamConstraints) {
  return navigator.mediaDevices.getUserMedia({
    audio: constraints.audio && {
      deviceId: constraints.audio.deviceId,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: constraints.video && {
      deviceId: constraints.video.deviceId,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  });
}
```

### Stream in Store

```typescript
// shared/stores/media.store.ts
const useMediaStore = create((set, get) => ({
  localStream: null,
  audioTrack: null,
  videoTrack: null,
  audioEnabled: false,
  videoEnabled: false,

  setLocalStream: (stream) =>
    set({
      localStream: stream,
      audioTrack: stream?.getAudioTracks()[0] ?? null,
      videoTrack: stream?.getVideoTracks()[0] ?? null,
      audioEnabled: stream?.getAudioTracks()[0]?.enabled ?? false,
      videoEnabled: stream?.getVideoTracks()[0]?.enabled ?? false,
    }),

  toggleAudio: () => {
    const { audioTrack, audioEnabled } = get();
    if (audioTrack) {
      audioTrack.enabled = !audioEnabled;
      set({ audioEnabled: !audioEnabled });
    }
  },

  toggleVideo: () => {
    const { videoTrack, videoEnabled } = get();
    if (videoTrack) {
      videoTrack.enabled = !videoEnabled;
      set({ videoEnabled: !videoEnabled });
    }
  },

  cleanup: () => {
    const { localStream } = get();
    localStream?.getTracks().forEach(track => track.stop());
    set({
      localStream: null,
      audioTrack: null,
      videoTrack: null,
      audioEnabled: false,
      videoEnabled: false,
    });
  },
}));
```

## Screen Share

### Starting Screen Share

```typescript
async function startScreenShare(options?: {
  entireScreenOnly?: boolean;
}) {
  const constraints: DisplayMediaStreamOptions = {
    video: {
      displaySurface: options?.entireScreenOnly ? 'monitor' : undefined,
    },
    audio: true, // Include system audio if available
  };

  const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

  // Handle user stopping share via browser UI
  stream.getVideoTracks()[0].onended = () => {
    useMediaStore.getState().setScreenShareEnabled(false);
  };

  return stream;
}
```

### Screen Share Enforcement

```typescript
// features/compliance/hooks/useScreenShareEnforcement.ts
function useScreenShareEnforcement() {
  const { isModuleEnabled, config } = useSessionConfig();
  const screenShareEnabled = useMediaStore(s => s.screenShareEnabled);

  const isRequired = isModuleEnabled('screenShare') &&
    config?.modules.screenShare?.required;

  useEffect(() => {
    if (isRequired && !screenShareEnabled) {
      // Show warning or prevent session actions
      showScreenShareRequiredModal();
    }
  }, [isRequired, screenShareEnabled]);

  return { isRequired, isActive: screenShareEnabled };
}
```

## Peer Connection Management

### Creating Peer Connection

```typescript
function createPeerConnection(participantId: string) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers for production
    ],
  });

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.emit('rtc.ice-candidate', {
        targetId: participantId,
        candidate: event.candidate,
      });
    }
  };

  // Handle remote tracks
  pc.ontrack = (event) => {
    setRemoteStream(participantId, event.streams[0]);
  };

  // Add local tracks
  const localStream = useMediaStore.getState().localStream;
  localStream?.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  return pc;
}
```

### Signaling for WebRTC

```typescript
// Handle offer
subscribe('rtc.offer', async (msg) => {
  const pc = getPeerConnection(msg.payload.fromId);
  await pc.setRemoteDescription(msg.payload.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  ws.emit('rtc.answer', {
    targetId: msg.payload.fromId,
    sdp: answer,
  });
});

// Handle answer
subscribe('rtc.answer', async (msg) => {
  const pc = getPeerConnection(msg.payload.fromId);
  await pc.setRemoteDescription(msg.payload.sdp);
});

// Handle ICE candidate
subscribe('rtc.ice-candidate', async (msg) => {
  const pc = getPeerConnection(msg.payload.fromId);
  await pc.addIceCandidate(msg.payload.candidate);
});
```

## Video Grid

```typescript
// features/media/components/VideoGrid.tsx
function VideoGrid() {
  const participants = useSessionStore(s => Array.from(s.participants.values()));
  const myId = useSessionStore(s => s.myParticipantId);
  const localStream = useMediaStore(s => s.localStream);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
      {/* Local video */}
      <VideoTile
        stream={localStream}
        label="You"
        isLocal
      />

      {/* Remote videos */}
      {participants
        .filter(p => p.id !== myId)
        .map(participant => (
          <VideoTile
            key={participant.id}
            stream={getRemoteStream(participant.id)}
            label={participant.displayName}
          />
        ))}
    </div>
  );
}
```

## Critical Rules

1. **Always clean up streams** - Stop tracks when component unmounts
2. **Handle device changes** - Listen to devicechange event
3. **Request permissions early** - In lobby before session
4. **Handle permission denials** - Show clear error messages
5. **Monitor connection state** - Handle ICE failures gracefully

## Related Documentation

- [WebRTC Media Skill](../../.claude/skills/webrtc-media/)
- [Data Flows](../model/data-flows.md)
- [State Management](../model/state-management.md)
