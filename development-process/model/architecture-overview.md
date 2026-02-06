# Architecture Overview

## Monorepo Structure

```
realtime-frontend/
├── apps/
│   └── web/                    # Main web application
│       ├── src/
│       │   ├── app/            # Composition root
│       │   ├── pages/          # Route components
│       │   ├── features/       # Feature modules
│       │   ├── shared/         # Cross-cutting concerns
│       │   └── types/          # Centralized types
│       └── e2e/                # Playwright tests
└── packages/
    ├── ui/                     # @realtime/ui - Component library
    └── protocol/               # @realtime/protocol - WebSocket types
```

## Feature-Sliced Design (FSD)

The application follows Feature-Sliced Design with clear layer boundaries:

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

## Feature Module Structure

Each feature follows a consistent internal structure:

```
features/
├── auth/
│   ├── api/                # auth.service.ts
│   ├── model/              # auth.context.ts (contexts only; stores in shared/stores)
│   ├── hooks/              # useAuth, useLogin, useLogout
│   ├── components/         # LoginForm, ProtectedRoute
│   ├── schemas/            # Zod validation
│   └── index.ts            # Public API exports
```

**Note:** Zustand stores that are used across features (auth, session, media, ui) belong in `shared/stores/`. Feature `model/` folders contain only React contexts.

## apps/web Directory Structure

```
apps/web/src/
├── app/                    # Composition root
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   ├── router/             # TanStack Router
│   ├── providers/          # AuthProvider, ThemeProvider
│   └── layouts/            # RootLayout, etc.
├── pages/                  # Route page components
├── features/               # Feature modules
│   ├── auth/
│   ├── session/
│   ├── media/
│   ├── ai/
│   ├── compliance/
│   ├── recording/
│   ├── transcript/
│   ├── outcomes/
│   ├── integrations/
│   ├── dashboard/
│   ├── users/
│   ├── workspaces/
│   └── ...
├── shared/                 # Cross-cutting
│   ├── ui/                 # Re-exports @realtime/ui
│   ├── components/         # ErrorBoundary, LoadingScreen
│   ├── hooks/              # Re-exports @realtime/ui hooks
│   ├── stores/             # auth.store, session.store, media.store, ui.store
│   ├── model/              # React contexts only (AuthContext)
│   ├── services/           # api-client, query-keys
│   ├── theme/              # ThemeContext, useTheme
│   └── lib/                # utils
└── types/                  # Centralized types
    ├── domain.ts           # User, Role, Permission
    ├── api.ts              # API contracts
    └── index.ts            # Barrel export
```

## Package Boundaries

### @realtime/ui

Pure UI components with no business logic. Reusable in any React app.

```
packages/ui/src/
├── themes/                 # Design tokens
├── primitives/             # Radix UI wrappers
├── components/             # Styled components
└── hooks/                  # UI hooks (useClipboard, etc.)
```

### @realtime/protocol

Shared WebSocket message types and envelopes.

```
packages/protocol/src/
├── envelope.ts             # Message envelope structure
├── session.ts              # Session message types
├── participant.ts          # Participant types
└── role-config.ts          # PublicRoleConfig types
```

### packages/ui vs apps/web/shared Rule

```
┌─────────────────────────────────────────────────────────────┐
│ Can this component work in ANY React app without knowing    │
│ about users, sessions, tenants, or calling our API?         │
├─────────────────────────────────────────────────────────────┤
│ YES → packages/ui (@realtime/ui)                            │
│ NO  → apps/web/src/shared                                   │
└─────────────────────────────────────────────────────────────┘
```

## Import Patterns

```typescript
// 1. React
import { useState } from 'react';

// 2. External libs
import { useQuery } from '@tanstack/react-query';

// 3. Types
import type { User } from '@/types';

// 4. Shared
import { Button } from '@/shared/ui';

// 5. Features
import { useAuth } from '@/features/auth';

// 6. Stores/services
import { useSessionStore } from '@/shared/stores';

// 7. Utils
import { cn } from '@/shared/lib/utils';

// 8. Styles
import './styles.css';
```

## Type Organization

| Category | Location | Examples |
|----------|----------|----------|
| **Domain types** | `types/domain.ts` | `User`, `UserRole`, `Theme`, `Permission` |
| **API contracts** | `types/api.ts` | `AuthUser`, `LoginCredentials` |
| **Feature types** | `features/*/types.ts` | Feature-specific (if needed) |
| **Component props** | Co-located | `ButtonProps` in `Button.tsx` |

## Related Documentation

- [Component Architecture](./component-architecture.md)
- [State Management](./state-management.md)
- [Coding Standards](../development/coding-standards.md)
