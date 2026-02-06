---
name: domain-config-patterns
description: Use when implementing configuration-driven UI, using useSessionConfig, or working with PublicRoleConfig
---

# Domain Configuration Patterns

Configuration-driven UI patterns using useSessionConfig and PublicRoleConfig.

## Overview

This skill covers the config-driven approach where UI behavior is determined by configuration rather than hardcoded domain logic. The system supports multiple business domains (interviews, assessments, training) through a single codebase.

---

## Core Principle

```typescript
// ✅ CORRECT - Configuration-driven
const { isModuleEnabled, isAIEnabled } = useSessionConfig();

return (
  <div>
    {isModuleEnabled('chat') && <ChatPanel />}
    {isAIEnabled && <AIControls />}
  </div>
);

// ❌ WRONG - Hardcoded domain logic
if (domainType === 'interview') {
  return <InterviewMode />;
}

// ❌ WRONG - Hardcoded role checks
if (role === 'candidate') {
  return <CandidateView />;
}
```

---

## useSessionConfig Hook

### Full API Reference

```typescript
interface SessionConfigResult {
  // Module checks
  isModuleEnabled: (module: string) => boolean;

  // Feature flags
  isRecordingEnabled: boolean;
  isAIEnabled: boolean;
  isComplianceEnabled: boolean;
  isChatEnabled: boolean;
  isTranscriptEnabled: boolean;

  // Participant role
  isObserver: boolean;
  isFacilitator: boolean;
  localParticipantId: string | null;

  // Role config (PublicRoleConfig)
  roleConfig: PublicRoleConfig | null;

  // Flow navigation
  flow: ConversationFlow | undefined;
  stageOrder: string[];
  getStage: (stageId: string) => FlowStage | undefined;

  // Capabilities
  capabilities: PublicCapabilities | undefined;
  isCapabilityEnabled: (capability: string) => boolean;

  // Metadata
  meta: PublicMeta | undefined;
  personaName: string | undefined;
  organizationName: string | undefined;
  locale: string | undefined;

  // Recording settings
  recordingConfig: RecordingConfig | undefined;

  // Compliance settings
  complianceConfig: ComplianceConfig | undefined;
}
```

### Basic Usage

```typescript
import { useSessionConfig } from '@/features/sessions/hooks/useSessionConfig';

function SessionRoom() {
  const {
    isModuleEnabled,
    isAIEnabled,
    isRecordingEnabled,
    isObserver,
    roleConfig,
  } = useSessionConfig();

  return (
    <div className="flex">
      {/* Main content */}
      <VideoGrid />

      {/* Conditional panels based on config */}
      {isModuleEnabled('chat') && <ChatPanel />}
      {isModuleEnabled('transcript') && <TranscriptPanel />}

      {/* AI controls for non-observers */}
      {isAIEnabled && !isObserver && <AIControls />}

      {/* Recording indicator */}
      {isRecordingEnabled && <RecordingIndicator />}
    </div>
  );
}
```

---

## PublicRoleConfig Structure

```typescript
interface PublicRoleConfig {
  // Role identification
  roleId: string;
  name: string;

  // Permissions
  permissions: RolePermissions;

  // Enabled modules
  modules: {
    chat?: { enabled: boolean };
    recording?: { enabled: boolean; format?: string };
    ai?: { enabled: boolean; mode?: string };
    compliance?: { enabled: boolean; level?: string };
    transcript?: { enabled: boolean };
  };

  // Conversation flow (stages)
  flow?: ConversationFlow;

  // Capabilities (fine-grained features)
  capabilities?: PublicCapabilities;

  // Metadata
  meta?: PublicMeta;
}

interface RolePermissions {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
  canChat: boolean;
  canViewTranscript: boolean;
  canViewRecording: boolean;
  canEndSession: boolean;
  canMuteOthers: boolean;
  canRemoveParticipants: boolean;
}
```

---

## Module Enablement Patterns

### Basic Module Check

```typescript
// ✅ CORRECT - Check module enabled
const { isModuleEnabled } = useSessionConfig();

if (isModuleEnabled('chat')) {
  // Chat is available
}

// ✅ CORRECT - Multiple module checks
const showSidebar =
  isModuleEnabled('chat') ||
  isModuleEnabled('transcript') ||
  isModuleEnabled('ai');
```

### Module with Options

```typescript
// ✅ CORRECT - Access module configuration
const { roleConfig } = useSessionConfig();

const recordingFormat = roleConfig?.modules.recording?.format ?? 'mp4';
const aiMode = roleConfig?.modules.ai?.mode ?? 'interactive';
```

---

## Flow Navigation

```typescript
// ✅ CORRECT - Stage-based navigation
const { flow, stageOrder, getStage } = useSessionConfig();

function StageIndicator() {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  if (!flow) return null;

  const currentStageId = stageOrder[currentStageIndex];
  const currentStage = getStage(currentStageId);

  return (
    <div className="flex items-center gap-2">
      {stageOrder.map((stageId, index) => {
        const stage = getStage(stageId);
        return (
          <StageStep
            key={stageId}
            label={stage?.name}
            isActive={index === currentStageIndex}
            isComplete={index < currentStageIndex}
          />
        );
      })}
    </div>
  );
}
```

### Flow Stage Structure

```typescript
interface ConversationFlow {
  stages: Record<string, FlowStage>;
  stageOrder?: string[];
  transitions?: Record<string, string[]>;
}

interface FlowStage {
  id: string;
  name: string;
  description?: string;
  duration?: number; // minutes
  prompts?: string[];
  aiConfig?: {
    enabled: boolean;
    mode?: string;
    systemPrompt?: string;
  };
}
```

---

## Capabilities System

```typescript
// ✅ CORRECT - Fine-grained capability checks
const { capabilities, isCapabilityEnabled } = useSessionConfig();

// Check if capability is enabled
if (isCapabilityEnabled('screenAnnotations')) {
  return <AnnotationTools />;
}

// Access capability settings
const screenshotInterval = capabilities?.periodicScreenshots?.intervalSeconds ?? 60;
```

### Capability Structure

```typescript
interface PublicCapabilities {
  screenAnnotations?: { enabled: boolean };
  periodicScreenshots?: { enabled: boolean; intervalSeconds: number };
  realTimeAnalytics?: { enabled: boolean };
  aiSuggestions?: { enabled: boolean; mode: 'passive' | 'active' };
  identityVerification?: { enabled: boolean; frequency: number };
}
```

---

## Metadata Layer

```typescript
// ✅ CORRECT - Access persona and organization info
const { meta, personaName, organizationName, locale } = useSessionConfig();

function SessionHeader() {
  return (
    <header>
      {personaName && (
        <span className="text-muted-foreground">
          Powered by {personaName}
        </span>
      )}
      {organizationName && (
        <span className="text-sm">
          {organizationName}
        </span>
      )}
    </header>
  );
}
```

### Meta Structure

```typescript
interface PublicMeta {
  persona?: {
    name: string;
    avatar?: string;
    description?: string;
  };
  organization?: {
    name: string;
    logo?: string;
  };
  locale?: string;
  timezone?: string;
}
```

---

## Observer vs Participant

```typescript
// ✅ CORRECT - Different views based on observer status
const { isObserver, isFacilitator } = useSessionConfig();

function SessionControls() {
  // Observers have limited controls
  if (isObserver) {
    return (
      <div className="flex gap-2">
        <VolumeControl />
        <LeaveButton />
      </div>
    );
  }

  // Full controls for participants
  return (
    <div className="flex gap-2">
      <MicToggle />
      <CameraToggle />
      <ScreenShareButton />
      {isFacilitator && <FacilitatorControls />}
      <LeaveButton />
    </div>
  );
}
```

### Observer Detection

```typescript
// Observer is determined by permissions
const isObserver = localParticipant
  ? !(localParticipant.role?.permissions?.canPublishAudio ||
      localParticipant.role?.permissions?.canPublishVideo)
  : false;
```

---

## Recording Configuration

```typescript
// ✅ CORRECT - Access recording settings
const { isRecordingEnabled, recordingConfig, roleConfig } = useSessionConfig();

function RecordingControls() {
  if (!isRecordingEnabled) return null;

  const format = roleConfig?.modules.recording?.format ?? 'webm';
  const includeAudio = recordingConfig?.includeAudio ?? true;
  const includeVideo = recordingConfig?.includeVideo ?? true;

  return (
    <div>
      <RecordingIndicator format={format} />
      {includeAudio && <AudioLevelMeter />}
    </div>
  );
}
```

---

## Compliance Configuration

```typescript
// ✅ CORRECT - Access compliance settings
const { isComplianceEnabled, complianceConfig } = useSessionConfig();

function ComplianceOverlay() {
  if (!isComplianceEnabled) return null;

  const {
    browserLockEnabled,
    identityChallengeEnabled,
    screenshotCaptureEnabled,
  } = complianceConfig ?? {};

  return (
    <>
      {browserLockEnabled && <BrowserLockEnforcer />}
      {identityChallengeEnabled && <IdentityChallengeModal />}
      {screenshotCaptureEnabled && <ScreenshotCapture />}
    </>
  );
}
```

---

## Component Guard Pattern

```typescript
// ✅ CORRECT - HOC for module-gated components
function withModuleGuard<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredModule: string
) {
  return function ModuleGuardedComponent(props: P) {
    const { isModuleEnabled } = useSessionConfig();

    if (!isModuleEnabled(requiredModule)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Usage
const GuardedChatPanel = withModuleGuard(ChatPanel, 'chat');
const GuardedAIControls = withModuleGuard(AIControls, 'ai');
```

---

## Critical Rules

1. **Never hardcode domain logic** - use `isModuleEnabled()` instead
2. **Never hardcode role checks** - use `isObserver`, `isFacilitator`, permissions
3. **Use config for feature flags** - not environment variables
4. **Handle missing config gracefully** - always provide defaults
5. **Memoize config derivations** - useSessionConfig is already memoized
6. **Access modules via roleConfig** - for detailed module settings
7. **Use flow for navigation** - stage-based UX from config

---

## Related Skills

- `permission-patterns` - Role-based permissions
- `react-patterns` - Hook consumption
- `feature-module-architecture` - Config placement
