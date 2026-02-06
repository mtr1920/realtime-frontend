# Configuration-Driven Rendering

## Overview

The UI adapts dynamically based on `PublicRoleConfig` received from the backend. Components render based on configuration, not hardcoded domain or role logic.

## Core Principle

```typescript
// ✅ CORRECT: Config-driven
const { isModuleEnabled } = useSessionConfig();
{isModuleEnabled('ai') && <AIControls />}

// ❌ WRONG: Hardcoded domain
if (domainType === 'interview') { <InterviewControls /> }

// ❌ WRONG: Hardcoded role
if (role === 'candidate') { <CandidateView /> }
```

---

## useSessionConfig Hook

The primary hook for accessing configuration:

```typescript
const {
  // Core configuration
  config,           // Full PublicRoleConfig object
  permissions,      // RolePermissions

  // Module checks
  isModuleEnabled,  // (module: string) => boolean

  // Flow stages
  flow,             // ConversationFlow | undefined
  getStage,         // (stageId: string) => FlowStage | undefined
  getFirstStage,    // () => string | undefined
  getOrderedStageIds, // () => string[]

  // Capabilities
  capabilities,     // PublicCapabilities
  isCapabilityEnabled, // (cap: string) => boolean

  // Meta layer
  meta,             // PublicMeta | undefined
  personaName,      // string (AI persona display name)
  organizationName, // string (tenant organization name)
} = useSessionConfig();
```

---

## Module Enablement

### Checking Module Status

```typescript
function SessionRoom() {
  const { isModuleEnabled } = useSessionConfig();

  return (
    <div>
      {/* AI module */}
      {isModuleEnabled('ai') && (
        <>
          <AIStatusIndicator />
          <AITranscript />
        </>
      )}

      {/* Recording module */}
      {isModuleEnabled('recording') && <RecordingIndicator />}

      {/* Compliance module */}
      {isModuleEnabled('compliance') && <ComplianceOverlay />}

      {/* Screen share module */}
      {isModuleEnabled('screenShare') && <ScreenShareControls />}
    </div>
  );
}
```

### Module-Specific Configuration

```typescript
function ScreenShareButton() {
  const { config, isModuleEnabled } = useSessionConfig();

  if (!isModuleEnabled('screenShare')) return null;

  const { required, entireScreenOnly } = config.modules.screenShare ?? {};

  return (
    <Button onClick={startScreenShare}>
      {required ? 'Start Screen Share (Required)' : 'Share Screen'}
    </Button>
  );
}
```

---

## Permission-Based Rendering

### Role Permissions

```typescript
function MediaControls() {
  const { permissions } = useSessionConfig();

  return (
    <div className="flex gap-2">
      {permissions.canPublishAudio && <AudioToggle />}
      {permissions.canPublishVideo && <VideoToggle />}
      {permissions.canShareScreen && <ScreenShareButton />}
    </div>
  );
}
```

### Session Controls

```typescript
function SessionActions() {
  const { permissions } = useSessionConfig();

  return (
    <div>
      {permissions.canPauseSession && <PauseButton />}
      {permissions.canEndSession && <EndSessionButton />}
      {permissions.canMuteOthers && <MuteAllButton />}
    </div>
  );
}
```

### usePermissions Hook (Alternative)

```typescript
function EndSessionButton() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('canEndSession')) return null;

  return <Button onClick={endSession}>End Session</Button>;
}
```

---

## Conversation Flow Stages

### Rendering Stage Progress

```typescript
function SessionProgress() {
  const { flow, getOrderedStageIds, getStage } = useSessionConfig();
  const currentStageId = useSessionStore((s) => s.currentStageId);

  if (!flow?.stages.length) return null;

  return (
    <div className="flex gap-2">
      {getOrderedStageIds().map((stageId) => {
        const stage = getStage(stageId);
        return (
          <StageIndicator
            key={stageId}
            name={stage?.name}
            isCurrent={stageId === currentStageId}
            isComplete={stage?.order < (getStage(currentStageId)?.order ?? 0)}
          />
        );
      })}
    </div>
  );
}
```

### Stage-Specific Content

```typescript
function CurrentStageContent() {
  const { getStage } = useSessionConfig();
  const currentStageId = useSessionStore((s) => s.currentStageId);
  const stage = getStage(currentStageId ?? '');

  if (!stage) return null;

  return (
    <div>
      <h2>{stage.name}</h2>
      {stage.duration && <Timer duration={stage.duration} />}
      {stage.prompts?.map((prompt, i) => (
        <p key={i}>{prompt}</p>
      ))}
    </div>
  );
}
```

---

## Capability Checks

```typescript
function SecurityFeatures() {
  const { isCapabilityEnabled } = useSessionConfig();

  return (
    <>
      {isCapabilityEnabled('security') && <BrowserLockMonitor />}
      {isCapabilityEnabled('observer') && <ObserverBadge />}
      {isCapabilityEnabled('multiActor') && <ActorSwitcher />}
    </>
  );
}
```

---

## Meta Layer Access

### Organization Branding

```typescript
function SessionHeader() {
  const { meta, organizationName } = useSessionConfig();

  return (
    <header>
      {meta?.organization?.logoUrl && (
        <img src={meta.organization.logoUrl} alt={organizationName} />
      )}
      <h1>{organizationName}</h1>
    </header>
  );
}
```

### AI Persona

```typescript
function AIAvatar() {
  const { meta, personaName } = useSessionConfig();

  return (
    <div className="flex items-center gap-2">
      <Avatar src={meta?.persona?.avatarUrl} />
      <span>{personaName}</span>
    </div>
  );
}

function AIGreeting() {
  const { meta } = useSessionConfig();

  if (!meta?.persona?.greeting) return null;

  return <p className="text-muted">{meta.persona.greeting}</p>;
}
```

---

## Complete Example

```typescript
function SessionRoom({ sessionId }: { sessionId: string }) {
  const {
    isModuleEnabled,
    permissions,
    isCapabilityEnabled,
    meta,
    personaName,
  } = useSessionConfig();

  return (
    <div className="session-room">
      {/* Header with branding */}
      <header>
        {meta?.organization?.logoUrl && (
          <img src={meta.organization.logoUrl} alt="Logo" />
        )}
      </header>

      {/* Video grid */}
      <VideoGrid />

      {/* AI features */}
      {isModuleEnabled('ai') && (
        <div className="ai-panel">
          <AIAvatar name={personaName} avatar={meta?.persona?.avatarUrl} />
          <AITranscript />
        </div>
      )}

      {/* Controls based on permissions */}
      <div className="controls">
        {permissions.canPublishAudio && <AudioToggle />}
        {permissions.canPublishVideo && <VideoToggle />}
        {isModuleEnabled('screenShare') && permissions.canShareScreen && (
          <ScreenShareButton />
        )}
        {permissions.canEndSession && <EndSessionButton />}
      </div>

      {/* Compliance overlay */}
      {isModuleEnabled('compliance') && isCapabilityEnabled('security') && (
        <ComplianceOverlay />
      )}

      {/* Recording indicator */}
      {isModuleEnabled('recording') && <RecordingIndicator />}
    </div>
  );
}
```

---

## Anti-Patterns

```typescript
// ❌ NEVER: Hardcode domain type
if (config.domainType === 'interview') { ... }

// ❌ NEVER: Check role name
if (myRole.name === 'Candidate') { ... }

// ❌ NEVER: Feature flag by domain
const showAI = domainType !== 'support';

// ✅ ALWAYS: Use module checks
if (isModuleEnabled('ai')) { ... }

// ✅ ALWAYS: Use permission checks
if (permissions.canInteractWithAI) { ... }

// ✅ ALWAYS: Use capability checks
if (isCapabilityEnabled('security')) { ... }
```

---

## Related Documentation

- [Domain Types](../business/domain-types.md)
- [Domain Config Patterns Skill](../../.claude/skills/domain-config-patterns/)
- [React Patterns Skill](../../.claude/skills/react-patterns/)
