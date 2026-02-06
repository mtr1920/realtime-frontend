# Domain Types & Configuration

## Overview

The frontend consumes `PublicRoleConfig` from the backend to dynamically render UI based on domain type, enabled modules, role permissions, and conversation flow stages.

## Configuration Resolution (Client HRMS Integration)

When a user joins via a client-provided link:

1. **Session ID extraction** - Frontend extracts the canonical UUID from the URL
2. **Backend resolution** - Backend fetches configuration from the integration source
3. **Config sources** - API, direct database, or synced local storage
4. **Scope** - AI behavior, flow rules, proctoring, and real-time context

The same session-ID-driven integration model applies across all domains (interviews, presales, etc.).

## PublicRoleConfig Structure

```typescript
interface PublicRoleConfig {
  // Core
  id: string;
  version: number;

  // Role & Permissions
  role: RoleDefinition;
  permissions: RolePermissions;

  // Modules
  modules: ModuleConfigs;

  // Flow
  flow?: ConversationFlow;

  // Capabilities
  capabilities: PublicCapabilities;

  // Meta
  meta?: PublicMeta;
}
```

## Key Sections

### Role Permissions

```typescript
interface RolePermissions {
  // Session
  canStartSession: boolean;
  canEndSession: boolean;
  canPauseSession: boolean;

  // Media
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;

  // Participants
  canMuteOthers: boolean;
  canRemoveParticipants: boolean;

  // AI
  canInteractWithAI: boolean;
  canControlAI: boolean;

  // Outcomes
  canViewOutcomes: boolean;
  canEditOutcomes: boolean;

  // Recording
  canStartRecording: boolean;
  canStopRecording: boolean;
}
```

### Module Configs

```typescript
interface ModuleConfigs {
  ai?: AIModuleConfig;
  compliance?: ComplianceModuleConfig;
  recording?: RecordingModuleConfig;
  transcription?: TranscriptionModuleConfig;
  outcomes?: OutcomesModuleConfig;
  screenShare?: ScreenShareModuleConfig;
}

interface AIModuleConfig {
  enabled: boolean;
  actors: AIActorProfile[];
  activeActorId?: string;
}

interface ScreenShareModuleConfig {
  enabled: boolean;
  required: boolean;
  entireScreenOnly: boolean;
}

interface RecordingModuleConfig {
  enabled: boolean;
  consentRequired: boolean;
  mixAIAudio: boolean;
}
```

### Conversation Flow

```typescript
interface ConversationFlow {
  stages: FlowStage[];
  currentStageId?: string;
}

interface FlowStage {
  id: string;
  name: string;
  order: number;
  duration?: number;
  prompts?: string[];
}
```

### Capabilities

```typescript
interface PublicCapabilities {
  security: boolean;  // Proctoring, browser lock
  observer: boolean;  // Read-only spectator mode
  multiActor: boolean; // Multiple AI actors
}
```

### Meta Layer

```typescript
interface PublicMeta {
  persona?: {
    name: string;
    avatarUrl?: string;
    greeting?: string;
  };
  organization?: {
    name: string;
    logoUrl?: string;
  };
  locale?: string;
}
```

## useSessionConfig Hook

Access configuration in components via `useSessionConfig`:

```typescript
const {
  // Core
  config,           // Full PublicRoleConfig
  permissions,      // Role permissions
  isModuleEnabled,  // Check if module enabled

  // Flow
  flow,             // ConversationFlow stages
  getStage,         // Get stage by ID
  getFirstStage,    // Get first stage
  getOrderedStageIds,

  // Capabilities
  capabilities,
  isCapabilityEnabled,

  // Meta
  meta,
  personaName,
  organizationName,
} = useSessionConfig();
```

## Supported Domains

| Domain | Description | Key Config |
|--------|-------------|------------|
| `interview` | Candidate assessment | Screen share required, compliance |
| `presales` | Customer discovery | CRM integration, qualification |
| `hr-review` | Performance review | 360 feedback, evaluation |
| `support` | Customer support | Ticket integration, resolution |
| `training` | Onboarding/training | Progress tracking, certification |

## UI Adaptation Examples

### Module-Based Rendering

```typescript
function SessionRoom() {
  const { isModuleEnabled } = useSessionConfig();

  return (
    <div>
      <VideoGrid />
      {isModuleEnabled('ai') && <AIStatusIndicator />}
      {isModuleEnabled('recording') && <RecordingIndicator />}
      {isModuleEnabled('compliance') && <ComplianceOverlay />}
    </div>
  );
}
```

### Permission-Based Controls

```typescript
function SessionControls() {
  const { permissions } = useSessionConfig();

  return (
    <div>
      {permissions.canPublishAudio && <AudioToggle />}
      {permissions.canShareScreen && <ScreenShareButton />}
      {permissions.canEndSession && <EndSessionButton />}
    </div>
  );
}
```

### Flow Stage Rendering

```typescript
function SessionProgress() {
  const { flow, getOrderedStageIds } = useSessionConfig();
  const stages = getOrderedStageIds();

  return (
    <div>
      {stages.map(id => (
        <StageIndicator
          key={id}
          stage={flow?.stages.find(s => s.id === id)}
          isCurrent={flow?.currentStageId === id}
        />
      ))}
    </div>
  );
}
```

## Related Documentation

- [Config Rendering](../model/config-rendering.md) - Full hook API and patterns
- [Backend Domain Types](../../../realtime-backend/development-process/business/domain-types.md)
- [@realtime/protocol](../../packages/protocol/) - Type definitions
