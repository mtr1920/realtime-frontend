# Hooks API

## Authentication

### useAuth

Access authentication state and user info.

```tsx
import { useAuth } from '@/features/auth';

const { user, isAuthenticated, isLoading } = useAuth();
```

### useLogin

Handle user login with credentials.

```tsx
import { useLogin } from '@/features/auth';

const { login, isLoading, error } = useLogin({
  onSuccess: () => navigate('/dashboard'),
  onError: (err) => toast.error(err.message),
});

await login({ email, password, tenantId });
```

### useLogout

Handle user logout.

```tsx
import { useLogout } from '@/features/auth';

const { logout, isLoading } = useLogout();
```

### usePermissions

Check user permissions.

```tsx
import { usePermissions } from '@/features/auth';

const { hasPermission, permissions, role } = usePermissions();

if (hasPermission('canManageUsers')) {
  // Show admin UI
}
```

## Sessions

### useSessionConfig

Access session configuration (domain-driven).

```tsx
import { useSessionConfig } from '@/features/sessions';

const {
  isModuleEnabled,    // (module) => boolean
  getRoleConfig,      // (role) => RoleConfig
  getActiveModules,   // () => string[]
  sessionConfig,      // Full config object
} = useSessionConfig();

// Check if AI module is enabled
if (isModuleEnabled('ai')) {
  // Show AI controls
}
```

### useSession

Access current session state.

```tsx
import { useSession } from '@/features/sessions';

const {
  session,
  participants,
  isHost,
  isRecording,
} = useSession();
```

## Media

### useLocalMedia

Manage local media streams (camera, microphone).

```tsx
import { useLocalMedia } from '@/features/media';

const {
  localStream,
  audioEnabled,
  videoEnabled,
  toggleAudio,
  toggleVideo,
  audioInputs,
  videoInputs,
  selectAudioInput,
  selectVideoInput,
} = useLocalMedia();
```

### useScreenShare

Handle screen sharing.

```tsx
import { useScreenShare } from '@/features/media';

const {
  isSharing,
  screenStream,
  startScreenShare,
  stopScreenShare,
  error,
} = useScreenShare();
```

### useScreenShareEnforcement

Enforce screen share requirement for certain roles.

```tsx
import { useScreenShareEnforcement } from '@/features/media';

const {
  isRequired,
  isCompliant,
  showWarning,
  remainingTime,
} = useScreenShareEnforcement();
```

## AI

### useAI

AI interaction state and controls.

```tsx
import { useAI } from '@/features/ai';

const {
  isEnabled,
  isProcessing,
  toggleAI,
  clearHistory,
} = useAI();
```

### useTranscript

Real-time transcript access.

```tsx
import { useTranscript } from '@/features/transcript';

const {
  transcript,
  isTranscribing,
  clearTranscript,
} = useTranscript();
```

## Compliance

### useBrowserLock

Detect and report browser compliance violations.

```tsx
import { useBrowserLock } from '@/features/compliance';

const {
  violations,
  isLocked,
  lockBrowser,
  unlockBrowser,
} = useBrowserLock();
```

## Recording

### useRecording

Recording state and controls.

```tsx
import { useRecording } from '@/features/recording';

const {
  isRecording,
  recordingDuration,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
} = useRecording();
```

## Theme

### useTheme

Theme state and controls.

```tsx
import { useTheme } from '@/shared/theme';

const {
  theme,           // 'light' | 'dark' | 'system'
  resolvedTheme,   // 'light' | 'dark' (actual applied theme)
  setTheme,
  toggleTheme,
  isHighContrast,
  setHighContrast,
} = useTheme();
```

## Realtime

### useSubscription

Subscribe to WebSocket messages.

```tsx
import { useSubscription } from '@/features/realtime';

useSubscription('session.participant.joined', (payload) => {
  console.log('Participant joined:', payload.participant);
});
```

### useRealtimeConnection

WebSocket connection state.

```tsx
import { useRealtimeConnection } from '@/features/realtime';

const {
  isConnected,
  connectionState,
  reconnect,
} = useRealtimeConnection();
```
