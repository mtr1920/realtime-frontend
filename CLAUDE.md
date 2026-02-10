# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Multi-tenant, role-agnostic web application built with React 19, TypeScript 5.x, Vite, TanStack Query, Zustand, and Tailwind CSS.

---

## Commands

```bash
# Dev server
pnpm dev:web          # Vite dev server
pnpm stop:web         # Kill process on port 3000

# Build
pnpm build:web        # Production build
pnpm build:ui         # Build UI package only
pnpm preview:web      # Preview production build

# Full verification (run after every change)
pnpm typecheck:web && pnpm lint:web && pnpm test:web

# Tests
pnpm test:web             # All unit tests (Vitest + Testing Library)
pnpm test:web:coverage    # With coverage report
pnpm test:web:e2e         # Playwright E2E tests
pnpm test:web:e2e:ui      # E2E with Playwright UI
pnpm test:web:visual      # Visual regression tests
pnpm test:web:a11y        # Accessibility tests (axe-core)

# Single test (run from apps/web)
cd apps/web && pnpm vitest run src/path/to/file.test.tsx

# Watch mode for a single test
cd apps/web && pnpm vitest src/path/to/file.test.tsx

# Lint & format
pnpm lint:web         # ESLint
pnpm typecheck:web    # TypeScript check
pnpm format           # Prettier format
pnpm format:check     # Prettier check only
```

---

## Monorepo Structure

```
apps/web/src/
├── app/        # Composition root: router, providers, layouts
├── pages/      # Route page components
├── features/   # Feature modules (auth, session, media, ai, chat, etc.)
├── shared/     # Cross-cutting (ui, stores, services, hooks)
└── types/      # Domain types, API contracts

packages/
├── ui/         # @realtime/ui - Pure UI components (CVA, forwardRef)
└── protocol/   # @realtime/protocol - WebSocket schemas (shared with backend)
```

### Dependency Rules (STRICT)

```
app → features, shared, pages
pages → features, shared
features → shared, types (NEVER other features)
shared → types (NEVER features)
```

---

## Critical Patterns

| Pattern          | Rule                                                | Skill                      |
| ---------------- | --------------------------------------------------- | -------------------------- |
| Config-driven UI | `useSessionConfig()` — never hardcode domain logic  | `domain-config-patterns`   |
| Permissions      | `usePermissions()` — never hardcode role checks     | `permission-patterns`      |
| Server state     | TanStack Query only — never Zustand for server data | `tanstack-query-patterns`  |
| Client state     | Zustand only — never TanStack Query for UI state    | `zustand-state-management` |
| WebSocket        | `subscribe()` typed handlers — never raw socket     | `websocket-client`         |
| API calls        | Service layer + TanStack Query — never raw fetch    | `api-service-patterns`     |

### Feature Module Structure

```
features/auth/
├── api/                # auth.service.ts (TanStack Query hooks)
├── model/              # auth.context.ts (React contexts)
├── hooks/              # useAuth, useLogin, useLogout
├── components/         # LoginForm, ProtectedRoute
├── schemas/            # Zod validation
└── index.ts            # Public API exports
```

---

## Code Quality Rules

- No `any` — use `unknown` with type guards
- No `console.log` — use logger utility
- Config-driven UI: `useSessionConfig()`, not hardcoded feature flags
- Role-based permissions: `usePermissions()`, not string comparison on role names
- Accessibility: semantic HTML, keyboard support, ARIA
- `motion-safe:` prefix on all CSS animations

### File Limits

| Type       | Max Lines |
| ---------- | --------- |
| All files  | 600       |
| Components | 300       |
| Hooks      | 200       |
| Functions  | 30        |

### Import Order

```typescript
import { useState } from 'react'; // 1. React
import { useQuery } from '@tanstack/...'; // 2. External
import type { User } from '@/types'; // 3. Types
import { Button } from '@/shared/ui'; // 4. Shared
import { useAuth } from '@/features/auth'; // 5. Features
import { cn } from '@/shared/lib/utils'; // 6. Utils
```

---

## Skills Index

Skills in `.claude/skills/` contain authoritative code patterns. Check relevant skills before implementing.

### Pattern Skills

| Skill                       | When to Check                                 |
| --------------------------- | --------------------------------------------- |
| `tanstack-query-patterns`   | Data fetching, server state, mutations, cache |
| `zustand-state-management`  | Client state, stores, selectors               |
| `ui-component-patterns`     | CVA variants, theme tokens, styling           |
| `websocket-client`          | Real-time messaging, typed handlers           |
| `webrtc-media`              | Peer connections, media capture               |
| `routing-patterns`          | Routes, navigation, guards, lazy loading      |
| `form-validation`           | react-hook-form + Zod schemas                 |
| `testing-patterns`          | Vitest, Testing Library, mocks                |
| `domain-config-patterns`    | useSessionConfig, PublicRoleConfig            |
| `permission-patterns`       | Role-based access, usePermissions             |
| `api-service-patterns`      | API client, service layer                     |
| `error-handling`            | Error boundaries, error states                |
| `media-services-patterns`   | AudioWorklet, MediaRecorder                   |
| `datatable-patterns`        | Tables, pagination, row actions               |
| `mutation-wrapper-patterns` | Mutations with toasts, cache invalidation     |

### Workflow Skills

| Trigger            | Skill                     |
| ------------------ | ------------------------- |
| "run TDD"          | `test-driven-development` |
| "debug"            | `systematic-debugging`    |
| "brainstorm"       | `brainstorming`           |
| "write a plan"     | `writing-plans`           |
| "execute the plan" | `executing-plans`         |
| "review code"      | `requesting-code-review`  |

---

## Documentation Reference

| Priority | Path                                                         | When to Read                         |
| -------- | ------------------------------------------------------------ | ------------------------------------ |
| **P0**   | `/home/mtr/Projects/RealtimeApp/Docs/PRODUCTION-PRD.md`      | Every plan/implementation            |
| **P0**   | `/home/mtr/Projects/RealtimeApp/Docs/RoleInteractionSpec.md` | Role behavior, session flows, AI     |
| **P0**   | `/home/mtr/Projects/RealtimeApp/Docs/ActualProduct.md`       | Product/feature questions            |
| **P1**   | `development-process/model/architecture-overview.md`         | Monorepo structure, dependency rules |
| **P1**   | `development-process/model/state-management.md`              | Zustand + TanStack Query patterns    |
| **P1**   | `development-process/model/config-rendering.md`              | Config-driven UI, PublicRoleConfig   |
| **P2**   | `development-process/development/coding-standards.md`        | Style, conventions                   |
| **P2**   | `development-process/development/testing-strategy.md`        | Test patterns                        |
| **P2**   | `development-process/tracker/tasks.md`                       | Current phase, pending tasks         |

---

## Operating Rules

- Product docs (`ActualProduct.md`, `PRODUCTION-PRD.md`, `RoleInteractionSpec.md`) are the ultimate source of truth
- Role-agnostic: build for all domains, not just interviews
- Additive changes: preserve architecture, minimize refactors
- Config-driven modules and role-based permissions: never hardcode domain or role logic
- No backward compatibility code: no legacy fallbacks, delete unused code

---

## Commit Format

```
type(scope): brief description

- Detail 1
- Detail 2

Co-Authored-By: Xumane <noreply@xumane.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
Scopes: `web`, `ui`, `features/*`, `shared`

---

## Definition of Done

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

- [ ] TypeScript compiles, lint passes, tests pass
- [ ] No console.log or debug code
- [ ] Config-driven UI, role-based permissions
- [ ] Accessibility: semantic HTML, keyboard support, ARIA
- [ ] File/Function size limits respected
- [ ] `tracker/tasks.md` and `tracker/changelog.md` updated
