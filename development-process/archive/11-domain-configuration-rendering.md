---
title: "11. Domain Configuration Rendering"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 11. Domain Configuration Rendering

Configuration schema must mirror the backend role-agnostic domain model:
`/home/mtr/Projects/RealtimeApp/realtime-backend/development-process/plans/02-architecture/role-agnostic-domain-model.md`.

### 9.1 Config-Driven Component Rendering

```typescript
// features/session/hooks/useSessionConfig.ts
import { useMemo } from 'react';
import { useSessionStore } from '../stores/session.store';
import { DomainTypeConfig, RoleDefinition } from '@protocol/types';

export function useSessionConfig() {
  const config = useSessionStore((state) => state.config);

  const getRoleDefinition = useMemo(() => {
    return (roleId: string): RoleDefinition | undefined => {
      return config?.roles.find((r) => r.id === roleId);
    };
  }, [config]);

  const isModuleEnabled = useMemo(() => {
    return (module: keyof DomainTypeConfig['modules']): boolean => {
      return config?.modules[module]?.enabled ?? false;
    };
  }, [config]);

  const getModuleConfig = useMemo(() => {
    return <K extends keyof DomainTypeConfig['modules']>(
      module: K
    ): DomainTypeConfig['modules'][K] | null => {
      return config?.modules[module] ?? null;
    };
  }, [config]);

  return {
    config,
    getRoleDefinition,
    isModuleEnabled,
    getModuleConfig,
    domainType: config?.domainType,
    constraints: config?.constraints,
    uiHints: config?.uiHints,
  };
}
```

### 9.2 Conditional Module Rendering

```typescript
// features/session/components/SessionRoom.tsx
import { useSessionConfig } from '../hooks/useSessionConfig';
import { VideoGrid } from '@/features/media/components/VideoGrid';
import { AITranscript } from '@/features/ai/components/AITranscript';
import { ComplianceOverlay } from '@/features/compliance/components/ComplianceOverlay';
import { RecordingIndicator } from '@/features/recording/components/RecordingIndicator';
import { TranscriptPanel } from '@/features/transcript/components/TranscriptPanel';

export function SessionRoom() {
  const { isModuleEnabled, config, uiHints } = useSessionConfig();

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <main className="flex-1 relative">
        <VideoGrid />

        {/* AI Status (if enabled) */}
        {isModuleEnabled('ai') && <AIStatusIndicator />}

        {/* Recording Indicator (if enabled) */}
        {isModuleEnabled('recording') && <RecordingIndicator />}

        {/* Compliance Overlay (if enabled) */}
        {isModuleEnabled('compliance') && <ComplianceOverlay />}

        {/* Session Controls */}
        <SessionControls />
      </main>

      {/* Sidebar */}
      <aside className="w-80 border-l">
        {/* Tabs based on enabled modules */}
        <Tabs defaultValue="participants">
          <TabsList>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            {isModuleEnabled('transcription') && (
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            )}
            {isModuleEnabled('ai') && (
              <TabsTrigger value="ai">AI</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="participants">
            <ParticipantList />
          </TabsContent>

          {isModuleEnabled('transcription') && (
            <TabsContent value="transcript">
              <TranscriptPanel />
            </TabsContent>
          )}

          {isModuleEnabled('ai') && (
            <TabsContent value="ai">
              <AITranscript />
            </TabsContent>
          )}
        </Tabs>
      </aside>
    </div>
  );
}
```

### 9.3 Role-Based UI Rendering

```typescript
// features/session/components/SessionControls.tsx
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useSessionConfig } from '../hooks/useSessionConfig';
import { Button } from '@/components/ui/Button';

export function SessionControls() {
  const permissions = usePermissions();
  const { isModuleEnabled } = useSessionConfig();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
      {/* Audio Toggle - requires canPublishAudio */}
      {permissions.canPublishAudio && (
        <AudioToggleButton />
      )}

      {/* Video Toggle - requires canPublishVideo */}
      {permissions.canPublishVideo && (
        <VideoToggleButton />
      )}

      {/* Screen Share - requires canShareScreen */}
      {permissions.canShareScreen && (
        <ScreenShareButton />
      )}

      {/* AI Controls - requires canInteractWithAI and AI module enabled */}
      {permissions.canInteractWithAI && isModuleEnabled('ai') && (
        <AIControlButton />
      )}

      {/* End Session - requires canEndSession */}
      {permissions.canEndSession && (
        <Button variant="destructive" onClick={handleEndSession}>
          End Session
        </Button>
      )}

      {/* Leave Session - always available */}
      <Button variant="outline" onClick={handleLeave}>
        Leave
      </Button>
    </div>
  );
}
```

### 9.4 AI Actor + Observer + Recording Configuration

```typescript
// Example DomainTypeConfig (interview profile - one of many)
const config = {
  domainType: 'interview',
  roles: [
    { id: 'candidate', name: 'Candidate' },
    { id: 'observer', name: 'Observer' },
    { id: 'ai_interviewer', name: 'AI Interviewer' },
  ],
  modules: {
    ai: {
      enabled: true,
      activeActorId: 'ai_interviewer',
      actors: [
        {
          id: 'ai_interviewer',
          roleId: 'interviewer',
          displayName: 'Lyra',
          personaPrompt: 'Structured interviewer with concise follow-ups.',
          voice: { provider: 'gemini', voiceId: 'en-US-Standard-B' },
          avatar: { imageUrl: '/assets/ai-avatar.png' },
          capabilities: {
            canAskQuestions: true,
            canScoreResponses: true,
            canSummarize: true,
          },
        },
        {
          id: 'ai_presales',
          roleId: 'pre-sales-manager',
          displayName: 'Ava',
          personaPrompt: 'Customer discovery and qualification specialist.',
          voice: { provider: 'gemini', voiceId: 'en-US-Standard-C' },
          avatar: { imageUrl: '/assets/ai-presales.png' },
          capabilities: {
            canAskQuestions: true,
            canScoreResponses: false,
            canSummarize: true,
          },
        },
      ],
    },
    observer: {
      enabled: true,
      joinMode: 'readOnly',
    },
    screenShare: {
      enabled: true,
      required: true,
    },
    recording: {
      enabled: true,
      mixAiAudio: true,
      upload: { chunkMs: 5000 },
    },
    outcomes: {
      enabled: true,
      summary: { enabled: true },
      evaluation: { enabled: true },
      decision: { enabled: true },
    },
    integrations: {
      enabled: true,
      connectors: ['hrms-primary'],
    },
  },
  uiHints: {
    showObserverJoin: true,
    showAiAvatar: true,
    showOutcomePanel: true,
  },
};
```

This configuration allows the same UI to act as an interview app, a pre-sales assistant, or a people-manager review by swapping actor profiles and role permissions. Each domain profile is a config preset, not a separate code path.

---
