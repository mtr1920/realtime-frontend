---
title: "2. Project Structure"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 2. Project Structure frontend

### 2.1 Monorepo Integration (Feature-Sliced Design)

```
realtime-platform/
├── apps/
│   ├── web/                              # Main web application
│   │   ├── src/
│   │   │   ├── app/                      # Composition root
│   │   │   │   ├── App.tsx               # Root component
│   │   │   │   ├── main.tsx              # Entry point
│   │   │   │   ├── router/               # TanStack Router config
│   │   │   │   ├── providers/            # AuthProvider, ThemeProvider
│   │   │   │   └── layouts/              # RootLayout, etc.
│   │   │   │
│   │   │   ├── pages/                    # Route page components
│   │   │   │
│   │   │   ├── features/                 # Feature modules
│   │   │   │   ├── auth/                 # Authentication feature
│   │   │   │   ├── session/              # Session management
│   │   │   │   ├── media/                # WebRTC & Media
│   │   │   │   ├── ai/                   # AI Interaction
│   │   │   │   ├── compliance/           # Compliance & Monitoring
│   │   │   │   ├── recording/            # Recording
│   │   │   │   ├── transcript/           # Transcription
│   │   │   │   ├── outcomes/             # Summaries, evaluations, decisions
│   │   │   │   ├── integrations/         # Connector management + sync status
│   │   │   │   ├── admin/                # Admin Dashboard
│   │   │   │   └── observer/             # Observer/Spectator View
│   │   │   │
│   │   │   ├── shared/                   # Cross-cutting concerns
│   │   │   │   ├── ui/                   # Button, Input, Card, etc.
│   │   │   │   ├── components/           # ErrorBoundary, LoadingScreen
│   │   │   │   ├── hooks/                # useMediaQuery
│   │   │   │   ├── stores/               # ui.store, media.store, session.store
│   │   │   │   ├── services/             # api-client, query-keys, auth-adapter
│   │   │   │   ├── theme/                # ThemeContext, useTheme
│   │   │   │   ├── lib/                  # utils
│   │   │   │   └── icons/                # Icon components
│   │   │   │
│   │   │   ├── types/                    # Centralized TypeScript types
│   │   │   │   ├── domain.ts             # User, UserRole, Theme, Permission
│   │   │   │   ├── api.ts                # AuthUser, LoginCredentials, etc.
│   │   │   │   └── index.ts              # Barrel export
│   │   │   │
│   │   │
│   │   ├── e2e/                          # Playwright E2E tests
│   │   │   ├── home.spec.ts              # Home page tests
│   │   │   ├── theme.spec.ts             # Theme system tests
│   │   │   ├── accessibility.spec.ts     # Accessibility tests
│   │   │   ├── errors.spec.ts            # Error handling tests
│   │   │   ├── components.visual.spec.ts # Visual regression tests
│   │   │   └── responsive.mobile.spec.ts # Mobile responsive tests
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts              # Vitest configuration
│   │   ├── playwright.config.ts          # Playwright configuration
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── web-embed/                        # Embeddable widget (Phase 7)
│       └── ...
│
├── packages/
│   ├── ui/                               # Shared UI components
│   │   ├── src/
│   │   │   ├── components/               # Base components
│   │   │   ├── primitives/               # Radix primitives
│   │   │   └── themes/                   # Theme definitions
│   │   └── package.json
│   │
│   ├── protocol/                         # Shared with backend
│   │   └── ...                           # Message types, schemas
│   │
│   └── sdk/                              # Client SDK (Phase 7)
│       ├── src/
│       │   ├── client.ts
│       │   ├── session.ts
│       │   └── types.ts
│       └── package.json
```

### 2.2 Feature Module Structure

Each feature follows Feature-Sliced Design with clear internal organization:

```
features/
├── auth/                                 # Authentication Feature
│   ├── api/                              # API layer
│   │   └── auth.service.ts               # Auth API calls
│   ├── model/                            # State & context
│   │   ├── auth.store.ts                 # Zustand store
│   │   └── auth.context.ts               # React context
│   ├── hooks/                            # Feature hooks
│   │   ├── useAuth.ts                    # Main auth hook
│   │   ├── useLogin.ts                   # Login mutation
│   │   ├── useLogout.ts                  # Logout mutation
│   │   ├── useCurrentUser.ts             # Current user query
│   │   └── usePermissions.ts             # Permission checks
│   ├── components/                       # Feature components
│   │   ├── LoginForm.tsx
│   │   ├── SSOButtons.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PermissionGate.tsx
│   ├── schemas/                          # Validation schemas
│   │   └── auth.schema.ts                # Zod schemas
│   └── index.ts                          # Public API exports
│
├── session/                              # Session management
│   ├── api/
│   │   └── session.service.ts
│   ├── model/
│   │   └── session.store.ts
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useParticipants.ts
│   │   └── useSessionConfig.ts
│   ├── components/
│   │   ├── SessionLobby.tsx
│   │   ├── SessionRoom.tsx
│   │   ├── ParticipantList.tsx
│   │   ├── SessionControls.tsx
│   │   └── SessionTimer.tsx
│   └── index.ts
│
├── media/                                # WebRTC & Media
│   ├── api/
│   │   ├── webrtc.service.ts
│   │   └── media.service.ts
│   ├── model/
│   │   └── media.store.ts
│   ├── hooks/
│   │   ├── useMediaDevices.ts
│   │   ├── useWebRTC.ts
│   │   ├── useScreenShare.ts
│   │   └── useAudioLevel.ts
│   ├── components/
│   │   ├── VideoGrid.tsx
│   │   ├── VideoTile.tsx
│   │   ├── AudioVisualizer.tsx
│   │   ├── MediaControls.tsx
│   │   ├── ScreenShare.tsx
│   │   └── DeviceSelector.tsx
│   └── index.ts
│
├── ai/                                   # AI Interaction
│   ├── actors/                           # Actor profiles + personas
│   ├── avatar/                           # Avatar UI + audio routing
│   ├── api/
│   │   ├── audio-capture.service.ts
│   │   └── audio-playback.service.ts
│   ├── hooks/
│   │   ├── useAISession.ts
│   │   ├── useAudioCapture.ts
│   │   ├── useAudioPlayback.ts
│   │   └── useTranscription.ts
│   ├── components/
│   │   ├── AITranscript.tsx
│   │   ├── AIStatusIndicator.tsx
│   │   ├── TurnIndicator.tsx
│   │   └── AIControls.tsx
│   └── index.ts
│
├── compliance/                           # Compliance & Monitoring
│   ├── hooks/
│   │   ├── useCompliance.ts
│   │   ├── useBrowserLock.ts
│   │   └── useViolationDetector.ts
│   ├── components/
│   │   ├── ComplianceOverlay.tsx
│   │   ├── ViolationAlert.tsx
│   │   ├── IdentityChallenge.tsx
│   │   └── CompliancePanel.tsx
│   └── index.ts
│
├── recording/                            # Recording
│   ├── services/
│   │   ├── recording-mixer.ts            # Screen + mic + AI audio mix
│   │   └── recording-upload.ts           # Chunked upload to backend
│   ├── hooks/
│   │   └── useRecording.ts
│   ├── components/
│   │   ├── RecordingIndicator.tsx
│   │   ├── RecordingControls.tsx
│   │   └── RecordingConsent.tsx
│   └── index.ts
│
├── transcript/                           # Transcription
│   ├── hooks/
│   │   └── useTranscript.ts
│   ├── components/
│   │   ├── TranscriptPanel.tsx
│   │   ├── TranscriptEntry.tsx
│   │   └── TranscriptExport.tsx
│   └── index.ts
│
├── outcomes/                             # Summaries, evaluations, decisions
│   ├── api/
│   │   └── outcomes.service.ts
│   ├── hooks/
│   │   ├── useOutcomes.ts
│   │   └── useOutcomeArtifacts.ts
│   ├── components/
│   │   ├── OutcomePanel.tsx
│   │   ├── EvaluationSummary.tsx
│   │   ├── DecisionBadge.tsx
│   │   └── OutcomeArtifacts.tsx
│   └── index.ts
│
├── integrations/                         # Connectors & sync
│   ├── api/
│   │   └── integrations.service.ts
│   ├── hooks/
│   │   ├── useConnectors.ts
│   │   └── useSyncHistory.ts
│   ├── components/
│   │   ├── ConnectorCard.tsx
│   │   ├── ConnectorForm.tsx
│   │   └── SyncStatusTable.tsx
│   └── index.ts
│
├── admin/                                # Admin Dashboard
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── components/
│   │   ├── TenantSettings.tsx
│   │   ├── WorkspaceManager.tsx
│   │   ├── UserManager.tsx
│   │   ├── DomainConfigEditor.tsx
│   │   ├── WebhookManager.tsx
│   │   ├── APIKeyManager.tsx
│   │   └── AuditLogViewer.tsx
│   └── index.ts
│
└── observer/                             # Observer/Spectator View
    ├── components/
    │   ├── ObserverView.tsx
    │   ├── MultiSessionView.tsx
    │   └── SessionList.tsx
    └── index.ts
```

### 2.3 Type Organization

Types follow a hybrid approach for industry-grade applications:

| Category | Location | Examples |
|----------|----------|----------|
| **Domain types** | `types/domain.ts` | `User`, `UserRole`, `Theme`, `Permission`, `MediaDevice` |
| **API contracts** | `types/api.ts` | `AuthUser`, `LoginCredentials`, `LoginResponse` |
| **Feature types** | `features/*/types.ts` | Feature-specific types (if needed) |
| **Component props** | Co-located | `ButtonProps` in `Button.tsx` |

```typescript
// types/domain.ts - Core business entities
export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export interface User { id: string; email: string; role: UserRole; ... }
export type Theme = 'light' | 'dark' | 'system' | 'high-contrast';
export type Permission = 'canViewSessions' | 'canCreateSession' | ...;

// types/api.ts - API request/response contracts
export interface LoginCredentials { email: string; password: string; tenantId: string; }
export interface LoginResponse { accessToken: string; refreshToken: string; user: AuthUser; }
```

### 2.4 Dependency Rules (Feature-Sliced Design)

```
┌─────────────────────────────────────────────────────────────┐
│                          APP                                 │
│  Composition root: providers, router, layouts                │
│  Can import: features, shared, pages                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         PAGES                                │
│  Route components                                            │
│  Can import: features, shared                                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       FEATURES                               │
│  Feature modules (auth, session, media, ai, etc.)           │
│  Can import: shared, types                                   │
│  MUST NOT import: other features (use composition)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        SHARED                                │
│  Cross-cutting: ui, components, hooks, stores, services     │
│  Can import: types                                           │
│  MUST NOT import: features                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         TYPES                                │
│  Centralized type definitions                                │
│  Standalone - no internal dependencies                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Import Order Convention

```typescript
import { useState } from 'react';              // 1. React
import { useQuery } from '@tanstack/...';      // 2. External libs
import type { User, UserRole } from '@/types'; // 3. Types
import { Button } from '@/shared/ui';          // 4. Shared
import { useAuth } from '@/features/auth';     // 5. Features
import { useSessionStore } from '@/shared/stores'; // 6. Stores/services
import { cn } from '@/shared/lib/utils';       // 7. Utils
import './styles.css';                         // 8. Styles
```

---
