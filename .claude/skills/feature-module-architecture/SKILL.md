---
name: feature-module-architecture
description: Use when creating new features, organizing code, or reviewing module structure
---

# Feature Module Architecture

Feature-Sliced Design (FSD) and hexagonal architecture patterns for the realtime-frontend codebase.

## Overview

This skill covers the monorepo structure, feature module organization, dependency rules, and hexagonal architecture principles.

---

## Monorepo Structure

```
realtime-frontend/
├── apps/web/                   # Main web application
│   ├── src/app/                # Composition root (router, providers)
│   ├── src/pages/              # Route page components
│   ├── src/features/           # Feature modules
│   ├── src/shared/             # Cross-cutting concerns
│   └── src/types/              # Centralized TypeScript types
├── packages/
│   ├── ui/                     # @realtime/ui - Pure UI components
│   │   ├── themes/             # Design tokens
│   │   ├── primitives/         # Radix UI wrappers
│   │   └── components/         # Styled components
│   └── protocol/               # @realtime/protocol - WebSocket schemas
```

---

## Feature Module Structure

```
features/
├── auth/
│   ├── api/                    # Service layer
│   │   └── auth.service.ts
│   ├── components/             # Feature components
│   │   ├── LoginForm.tsx
│   │   └── PermissionGate.tsx
│   ├── hooks/                  # Feature hooks
│   │   ├── useLogin.ts
│   │   └── usePermissions.ts
│   ├── schemas/                # Zod validation schemas
│   │   └── auth.schema.ts
│   ├── stores/                 # Feature-specific Zustand stores
│   │   └── auth.store.ts
│   ├── types/                  # Feature types (if complex)
│   │   └── auth.types.ts
│   └── index.ts                # Public API (barrel export)
```

### Barrel Export Pattern

```typescript
// ✅ CORRECT - features/auth/index.ts
// Only export public API
export { LoginForm } from './components/LoginForm';
export { PermissionGate } from './components/PermissionGate';
export { useLogin } from './hooks/useLogin';
export { usePermissions } from './hooks/usePermissions';
export { authService } from './api/auth.service';
export type { LoginCredentials, AuthUser } from './types/auth.types';

// ❌ WRONG - Don't export internal implementation details
// export { handleTokenRefresh } from './api/auth.service';
// export { AuthStore } from './stores/auth.store';
```

---

## Dependency Rules (MANDATORY)

```
app → features, shared, pages
pages → features, shared
features → shared, types (NEVER other features directly)
shared → types (NEVER features)
types → standalone (no imports)
```

### Valid Imports

```typescript
// ✅ CORRECT - Page importing from features
// src/pages/SessionPage.tsx
import { SessionRoom, useSession } from '@/features/sessions';
import { ChatPanel } from '@/features/chat';
import { Button } from '@/shared/ui';

// ✅ CORRECT - Feature importing from shared
// src/features/sessions/hooks/useSession.ts
import { apiClient } from '@/shared/services';
import { useAuth } from '@/shared/model';
import type { Session } from '@/types';

// ✅ CORRECT - Cross-feature communication via shared store
// src/features/chat/hooks/useChat.ts
import { useSessionStore } from '@/shared/stores';
```

### Invalid Imports

```typescript
// ❌ WRONG - Feature importing from another feature
// src/features/chat/components/ChatPanel.tsx
import { useSession } from '@/features/sessions'; // Direct cross-feature!

// ❌ WRONG - Shared importing from feature
// src/shared/hooks/useNetworkStatus.ts
import { sessionService } from '@/features/sessions/api'; // Feature leak!

// ❌ WRONG - Circular dependency
// src/features/auth/hooks/useLogin.ts
import { useSessionStore } from '@/features/sessions/stores'; // Cycle!
```

### Cross-Feature Communication

```typescript
// ✅ CORRECT - Use shared stores for cross-feature state
// src/shared/stores/session.store.ts
export const useSessionStore = create<SessionState>()(...);

// Feature A reads
const sessionId = useSessionStore((s) => s.currentSessionId);

// Feature B writes
useSessionStore.getState().setCurrentSessionId(id);

// ✅ CORRECT - Use events/callbacks through props
// Parent page coordinates features
<SessionRoom sessionId={sessionId} onParticipantJoin={handleJoin} />
<ChatPanel sessionId={sessionId} />
```

---

## Hexagonal Architecture

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                           │
│   (React components - presentation only)                    │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                       │
│   (Hooks - orchestrate business logic)                      │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                            │
│   (Types, schemas, business rules)                          │
├─────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                    │
│   (Services - API, WebSocket, storage)                      │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer Pattern

```typescript
// ✅ CORRECT - Service handles infrastructure concerns
// features/sessions/api/sessions.service.ts
class SessionService {
  private readonly basePath = '/v1/sessions';

  async create(input: CreateSessionInput): Promise<Session> {
    return apiClient.post<Session>(this.basePath, input);
  }

  async list(params: ListParams): Promise<Session[]> {
    return apiClient.get<Session[]>(this.basePath, { params });
  }
}

export const sessionService = new SessionService();

// ✅ CORRECT - Hook orchestrates business logic
// features/sessions/hooks/useCreateSession.ts
export function useCreateSession() {
  return useMutationWithToast({
    mutationFn: sessionService.create,
    toast: { successMessage: 'Session created' },
    invalidateKeys: [queryKeys.sessions.root],
  });
}

// ✅ CORRECT - Component handles presentation
// features/sessions/components/CreateSessionButton.tsx
export function CreateSessionButton() {
  const { create, isPending } = useCreateSession();
  return (
    <Button onClick={() => create({ title: 'New' })} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create'}
    </Button>
  );
}
```

---

## packages/ui vs apps/web/shared

```
┌─────────────────────────────────────────────────────────────┐
│ Can this component work in ANY React app without knowing    │
│ about users, sessions, tenants, or calling our API?         │
├─────────────────────────────────────────────────────────────┤
│ YES → packages/ui (@realtime/ui)                            │
│       Examples: Button, Card, DataTable, Dialog             │
│                                                             │
│ NO  → apps/web/src/shared                                   │
│       Examples: UserAvatar, SessionStatusBadge, AuthGuard   │
└─────────────────────────────────────────────────────────────┘
```

### @realtime/ui Contents

```typescript
// Pure presentational components
export { Button } from './components/button';
export { Card } from './components/card';
export { DataTable } from './components/data-table';

// Radix primitives (wrapped)
export { Dialog, DialogContent } from './primitives/dialog';
export { DropdownMenu } from './primitives/dropdown-menu';

// Design tokens
export { colors, spacing, zIndexTokens } from './themes';

// UI hooks (no business logic)
export { useClipboard, useDebounce } from './hooks';
```

### apps/web/shared Contents

```typescript
// Business-aware components
export { ErrorBoundary } from './components/ErrorBoundary';
export { ProtectedRoute } from './components/ProtectedRoute';

// Business hooks
export { usePermissions } from './hooks/usePermissions';
export { useNetworkStatus } from './hooks/useNetworkStatus';

// Services (API, storage)
export { apiClient } from './services/api-client';
export { queryClient } from './services/queryClient';

// Shared stores
export { useAuthStore } from './stores/auth.store';
export { useSessionStore } from './stores/session.store';
```

---

## Type Organization

| Category | Location | Examples |
|----------|----------|----------|
| **Domain types** | `types/domain.ts` | `User`, `UserRole`, `Session` |
| **API contracts** | `types/api.ts` | `LoginResponse`, `CreateSessionInput` |
| **Feature types** | `features/*/types.ts` | Complex feature-specific types |
| **Component props** | Co-located | `ButtonProps` in `Button.tsx` |

```typescript
// ✅ CORRECT - types/domain.ts
export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// ✅ CORRECT - types/api.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `SessionRoom.tsx` |
| Hooks | camelCase with use prefix | `useSession.ts` |
| Services | kebab-case with .service | `sessions.service.ts` |
| Stores | kebab-case with .store | `session.store.ts` |
| Schemas | kebab-case with .schema | `session.schema.ts` |
| Tests | same name with .test | `useSession.test.ts` |
| Types | kebab-case with .types | `session.types.ts` |

---

## Critical Rules

1. **Never import features into shared** - breaks layering
2. **Never import features into other features** - use shared stores
3. **Always export via barrel file** - hide internal structure
4. **Service layer handles infrastructure** - API, storage, WebSocket
5. **Hooks orchestrate business logic** - coordinate services and stores
6. **Components handle presentation only** - no direct API calls
7. **Types in centralized location** - avoid scattered definitions

---

## Related Skills

- `api-service-patterns` - Service layer implementation
- `zustand-state-management` - Shared store patterns
- `react-patterns` - Component and hook patterns
