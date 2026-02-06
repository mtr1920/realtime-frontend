# Data Flows

## Overview

Key data flows in the application, showing interactions between components, stores, and services.

---

## 1. Authentication Flow

```
┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
│ LoginPage    │───▶│ authService │───▶│ API Server   │───▶│ Response  │
└──────────────┘    └─────────────┘    └──────────────┘    └───────────┘
       │                                                         │
       │                                                         ▼
       │                                              ┌──────────────────┐
       │                                              │ tokens, userData │
       │                                              └──────────────────┘
       │                                                         │
       ▼                                                         ▼
┌──────────────┐                                     ┌──────────────────┐
│ useMutation  │◀────────────────────────────────────│ auth.store       │
└──────────────┘                                     │ (setTokens,      │
       │                                             │  setUser)        │
       │                                             └──────────────────┘
       │                                                         │
       ▼                                                         ▼
┌──────────────┐                                     ┌──────────────────┐
│ onSuccess:   │                                     │ localStorage     │
│ navigate('/') │                                    │ (persist tokens) │
└──────────────┘                                     └──────────────────┘
```

### Steps

1. User submits credentials on `LoginPage`
2. `useMutation` calls `authService.login()`
3. API returns tokens and user data
4. `auth.store` stores tokens, user data
5. Tokens persist to localStorage
6. Navigate to dashboard

### Token Refresh

```typescript
// Interceptor in api-client
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await authService.refresh();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      }
      auth.store.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

---

## 2. Session Resolution Flow (Client HRMS Integration)

When a user joins via a client-provided link, the session ID is extracted and resolved into full configuration.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Client HRMS Session Flow                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Client HRMS creates session with UUID                                │
│  2. Client sends link: https://app/sessions/{uuid}/join                  │
│  3. User clicks link                                                     │
│                                                                          │
│     ┌────────────────┐                                                   │
│     │ /join/:shareId │  (share link resolver)                            │
│     │ or             │                                                   │
│     │ /sessions/:id/ │  (direct session link)                            │
│     │ lobby          │                                                   │
│     └───────┬────────┘                                                   │
│             │                                                            │
│             ▼                                                            │
│     ┌────────────────┐     ┌─────────────────────────────────────────┐  │
│     │ Extract UUID   │────▶│ API: GET /v1/sessions/{uuid}/invite-info│  │
│     │ from URL       │     │ (returns accessToken, roles[])          │  │
│     └────────────────┘     └─────────────────────────────────────────┘  │
│                                            │                             │
│                                            ▼                             │
│     ┌───────────────────────────────────────────────────────────────┐   │
│     │               Backend Resolution (invite-info)                 │   │
│     ├───────────────────────────────────────────────────────────────┤   │
│     │  1. Lookup session by canonical UUID                          │   │
│     │  2. Return accessToken (for joining) and available roles[]    │   │
│     │  3. Each role includes: id, name, classification              │   │
│     │  4. classification.isSpectator determines observer mode       │   │
│     └───────────────────────────────────────────────────────────────┘   │
│                                            │                             │
│                                            ▼                             │
│     ┌────────────────┐     ┌────────────────────────────────────────┐   │
│     │ SessionLobby   │◀────│ accessToken, roles[] for role          │   │
│     │ renders with   │     │ selection before join                  │   │
│     │ role options   │     └────────────────────────────────────────┘   │
│     └────────────────┘                                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Configuration Scope

Session configuration includes:
- **AI behavior** - Persona, provider, prompts, voice settings
- **Flow rules** - Interview stages, expected turns, skippable flags
- **Proctoring** - Browser lockdown, identity verification, screenshot capture
- **Context** - Candidate info, requisition info, client documents

### Integration Sources

Configuration may be fetched from:
- **Client API** - On-demand fetch from HRMS
- **Client database** - Direct read from replicated/connected DB
- **Synced local storage** - Previously cached in our database

### Example: AI Interview (HRMS)

```typescript
// 1. Client HRMS generates UUID and sends link
const clientLink = 'https://app/sessions/550e8400-e29b-41d4-a716-446655440000/lobby';

// 2. User clicks link, frontend extracts UUID
const sessionId = params.sessionId; // '550e8400-e29b-41d4-a716-446655440000'

// 3. Frontend fetches invite info (returns accessToken and available roles)
const { accessToken, roles } = await sessionService.getInviteInfo(sessionId);

// 4. User selects role (or first role is auto-selected) and joins
const response = await sessionService.join(sessionId, {
  accessToken,
  roleId: roles[0].id,
  displayName: 'John Doe',
});

// 5. Lobby stores credentials and navigates to room
// realtimeToken, wsEndpoint, participantId are stored in session.store
// WebSocket connection uses these credentials
```

### Example: Presales Session

```typescript
// Same flow, different context
// Backend fetches: presalesInstructions, clientDocuments, productInfo
```

Different roles use different context sources but follow the same session-ID-driven integration model.

---

## 3. Session Join Flow

**Joinable Statuses:** Sessions can be joined when status is `CREATED`, `WAITING`, or `ACTIVE`.
- Joining a `CREATED` session auto-transitions it to `WAITING`
- `PAUSED` sessions cannot accept new joins

```
┌────────────┐     ┌───────────────┐     ┌───────────────────┐
│ SessionLobby│────▶│ sessionService│────▶│ API: GET          │
│ Page        │     │ .getInviteInfo│     │ /v1/sessions/:id/ │
└────────────┘     └───────────────┘     │ invite-info       │
                                         └───────────────────┘
                                                │
                                                ▼
                                         ┌───────────────────┐
                                         │ accessToken,      │
                                         │ roles[]           │
                                         └───────────────────┘
                                                │
┌────────────┐     ┌───────────────┐     ┌───────────────────┐
│ JoinPanel  │────▶│ sessionService│────▶│ API: POST         │
│ (submit)   │     │ .join()       │     │ /v1/sessions/join │
└────────────┘     └───────────────┘     │ (public endpoint) │
                                         └───────────────────┘
                                                │
                                                ▼
                                         ┌───────────────────┐
                                         │ realtimeToken,    │
                                         │ wsEndpoint,       │
                                         │ participantId     │
                                         └───────────────────┘
                                                │
┌────────────────────────────────────────────────────────────────┐
│                       WebSocket Connection                      │
├────────────────────────────────────────────────────────────────┤
│  1. ws.connect(wsEndpoint, realtimeToken)                      │
│  2. Client sends session.join with displayName                 │
│  3. Server sends session.snapshot                              │
│  4. session.store.setSession(snapshot)                         │
│  5. UI renders with participants, phase, config                │
└────────────────────────────────────────────────────────────────┘
```

### Snapshot Structure

```typescript
interface SessionSnapshot {
  sessionId: string;
  status: SessionStatus;
  phase: string;
  participants: Participant[];
  myParticipantId: string;
  myRole: RoleDefinition;
  config: PublicRoleConfig;
  serverSeq: number;
}
```

### Real-time Updates

After join, WebSocket events update the store:

```typescript
subscribe('session.participant.joined', (msg) => {
  sessionStore.addParticipant(msg.payload.participant);
});

subscribe('session.participant.left', (msg) => {
  sessionStore.removeParticipant(msg.payload.participantId);
});

subscribe('session.phase.changed', (msg) => {
  sessionStore.setPhase(msg.payload.phase);
});
```

---

## 3. AI Interaction Flow

```
┌────────────┐     ┌──────────────────┐     ┌────────────────┐
│ User speaks│────▶│ AudioCapture     │────▶│ WebSocket:     │
│ (mic input)│     │ Service          │     │ ai.input.audio │
└────────────┘     └──────────────────┘     │ .append        │
                                            └────────────────┘
                                                    │
                                                    ▼
                                            ┌────────────────┐
                                            │ Backend AI     │
                                            │ Router         │
                                            └────────────────┘
                                                    │
                                                    ▼
┌────────────────────────────────────────────────────────────────┐
│                     AI Response Events                          │
├────────────────────────────────────────────────────────────────┤
│  ai.output.audio.chunk  → AudioPlayback.enqueue()              │
│  ai.output.text.delta   → transcript.append()                  │
│  ai.output.text.complete → transcript.finalize()               │
└────────────────────────────────────────────────────────────────┘
```

### Audio Capture → AI

```typescript
captureService.start(deviceId, (chunk) => {
  ws.emit('ai.input.audio.append', { audioData: chunk });
});
```

### AI → Audio Playback

```typescript
subscribe('ai.output.audio.chunk', (msg) => {
  playbackService.enqueueAudio(msg.payload.audioData);
  setAIState('speaking');
});
```

### Turn Management

```typescript
// User starts speaking (interrupts AI)
const startSpeaking = () => {
  playbackService.interrupt();
  ws.emit('ai.turn.start', {});
};

// User stops speaking
const stopSpeaking = () => {
  ws.emit('ai.turn.end', {});
  setAIState('processing');
};
```

---

## 4. Recording Flow

```
┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Screen + Mic +   │────▶│ RecordingMixer  │────▶│ MediaRecorder   │
│ AI Audio Mix     │     │ (Web Audio API) │     │ (WebM chunks)   │
└──────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────┐
│                      Chunk Upload Flow                          │
├────────────────────────────────────────────────────────────────┤
│  1. MediaRecorder emits dataavailable event                    │
│  2. ChunkUploader queues chunk                                 │
│  3. POST /recordings/:id/chunks with chunk data                │
│  4. Server stores in object storage                            │
│  5. On session end, server assembles final recording           │
└────────────────────────────────────────────────────────────────┘
```

### Audio Mix Setup

```typescript
// Mix screen audio + mic + AI playback
const mixer = new AudioContext();
const destination = mixer.createMediaStreamDestination();

screenStream.getAudioTracks().forEach((track) => {
  const source = mixer.createMediaStreamSource(new MediaStream([track]));
  source.connect(destination);
});

micStream.getAudioTracks().forEach((track) => {
  const source = mixer.createMediaStreamSource(new MediaStream([track]));
  source.connect(destination);
});

aiPlaybackService.connectOutput(destination);
```

### Chunk Upload

```typescript
recorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    chunkUploader.enqueue(event.data);
  }
};

// Uploader handles retries, ordering
await uploadChunk(sessionId, chunkIndex, chunkData);
```

---

## 5. Compliance Flow

```
┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Tab Switch   │────▶│ BrowserLock     │────▶│ compliance.     │
│ Detection    │     │ Monitor         │     │ violation       │
└──────────────┘     └─────────────────┘     │ (WebSocket)     │
                                             └─────────────────┘

┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Timer Tick   │────▶│ Screenshot      │────▶│ compliance.     │
│ (periodic)   │     │ Capture         │     │ screenshot      │
└──────────────┘     └─────────────────┘     │ (WebSocket)     │
                                             └─────────────────┘

┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Server Push  │────▶│ Challenge       │────▶│ User Response   │
│ challenge    │     │ Modal           │     │ (verify)        │
└──────────────┘     └─────────────────┘     └─────────────────┘
```

### Browser Lock Detection

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden && complianceEnabled) {
    ws.emit('compliance.violation', {
      type: 'tab_switch',
      timestamp: Date.now(),
    });
  }
});
```

### Identity Challenge

```typescript
subscribe('compliance.challenge', (msg) => {
  openChallengeModal({
    prompt: msg.payload.prompt,
    onSubmit: (response) => {
      ws.emit('compliance.challenge.response', { response });
    },
  });
});
```

---

## Related Documentation

- [WebSocket Client](../api/websocket-client.md)
- [AI Client](../api/ai-client.md)
- [Config Rendering](./config-rendering.md)
