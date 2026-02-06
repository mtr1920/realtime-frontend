# CLAUDE.md

Multi-tenant, role-agnostic web application built with React 19, TypeScript 5.x, Vite, TanStack Query, Zustand, and Tailwind CSS.

---

## Priority 0: Retrieval-First Principle

**MANDATORY FOR ALL TASKS**: Prefer retrieval-based reasoning over pre-training knowledge for React, TypeScript, TanStack Query, Zustand, Tailwind CSS, WebRTC, and WebSocket patterns.

```
┌─────────────────────────────────────────────────────────────────────┐
│ BEFORE writing any code or answering architecture questions:       │
│                                                                     │
│ 1. Read the relevant Documentation Index file(s) below             │
│ 2. Check Skills Index for matching patterns                        │
│ 3. If conflict exists: Local docs WIN over pre-training knowledge  │
│ 4. Only fall back to pre-training when no local doc/skill exists   │
└─────────────────────────────────────────────────────────────────────┘
```

This is NOT a decision point. Reading local documentation and skills is the **mandatory first step** for every task.

---

## Modification & Bug Fix Workflow (MANDATORY)

When user requests ANY code modification, feature addition, or bug fix, execute this workflow in order:

```
Step 1: ANALYZE CODEBASE
├── Read relevant files in the affected area
├── Identify current patterns and structure in use
├── Note dependencies and imports
└── Understand the data flow

Step 2: RETRIEVE FROM DOCUMENTATION & SKILLS
├── Check Documentation Index below for relevant docs
├── Check Skills Index for matching pattern skills
├── Read architecture docs from development-process/model/
├── Check tracker/tasks.md for related work
└── Compile relevant patterns before implementing

Step 3: FOLLOW EXISTING STRUCTURE
├── Match the coding style of surrounding code
├── Use same patterns as similar features
├── Apply patterns from retrieved skills
├── Respect dependency rules (see below)
└── Stay within file size limits

Step 4: IMPLEMENT
├── Make minimal, targeted changes
├── Preserve existing architecture
├── Use configuration-driven approach
└── Add/update tests as needed

Step 5: VERIFY & UPDATE TRACKER
├── Run: pnpm typecheck:web && pnpm lint:web && pnpm test:web
├── Update tracker/tasks.md if applicable
├── Update tracker/changelog.md with changes
└── Report completion status
```

**Do NOT skip steps.** Do NOT jump to implementation without completing Steps 1-3.

---

## Documentation Index (Source of Truth)

### Architecture & Patterns

| File | When to Read |
|------|--------------|
| `development-process/model/architecture-overview.md` | Monorepo structure, dependency rules, folder organization |
| `development-process/model/state-management.md` | Zustand stores, TanStack Query patterns, state separation |
| `development-process/model/component-architecture.md` | Component organization, feature modules, shared vs packages |
| `development-process/model/config-rendering.md` | Configuration-driven UI, PublicRoleConfig, useSessionConfig |
| `development-process/model/data-flows.md` | Data flow patterns, API → UI pipelines |
| `development-process/model/pages-and-routing.md` | Routing structure, lazy loading, route guards |
| `development-process/model/shared-packages.md` | @realtime/ui vs apps/web/shared decision rules |

### Development Standards

| File | When to Read |
|------|--------------|
| `development-process/development/coding-standards.md` | Code style, file limits, import order, naming conventions |
| `development-process/development/testing-strategy.md` | Test patterns, mocking, coverage requirements |
| `development-process/development/patterns.md` | Implementation patterns, hooks, services |
| `development-process/development/deployment.md` | Build, deploy, environment configuration |

### Project Tracking

| File | When to Read |
|------|--------------|
| `development-process/tracker/tasks.md` | Current phase, active tasks, priorities |
| `development-process/tracker/changelog.md` | Recent changes, what was modified |
| `development-process/tracker/backlog.md` | Deferred work, future tasks |
| `development-process/decisions/decision-log.md` | Why decisions were made, ADR references |

### External (Ultimate authority)

| File | When to Read |
|------|--------------|
| `/home/mtr/Projects/RealtimeApp/Docs/ActualProduct.md` | Product vision, business requirements (overrides all other docs if conflict) |
| `/home/mtr/Projects/RealtimeApp/Docs/PRODUCTION-PRD.md` | Production readiness: bugs, missing features, task breakdown, sprint plan — read for implementation planning, bug triage, feature prioritization |
| `/home/mtr/Projects/RealtimeApp/Docs/RoleInteractionSpec.md` | Role interaction flows, AI mute/unmute, speaking controls, tool dispatch — read for any role behavior, session flow, or AI interaction work |

---

## Skills Index (Pattern Retrieval)

Skills in `.claude/skills/` contain **authoritative code patterns**. Check relevant skills during retrieval step.

### Pattern Skills (Check during code tasks)

| Skill | When to Check |
|-------|---------------|
| `tanstack-query-patterns` | Data fetching, server state, mutations, cache invalidation |
| `zustand-state-management` | Client state, stores, selectors, actions |
| `react-patterns` | Components, hooks, React 19 features, refs |
| `ui-component-patterns` | CVA variants, theme tokens, styling, accessibility |
| `api-service-patterns` | API client, service layer, error handling |
| `websocket-client` | Real-time messaging, subscriptions, typed handlers |
| `webrtc-media` | Peer connections, media capture, video streaming |
| `routing-patterns` | Routes, navigation, guards, lazy loading |
| `form-validation` | react-hook-form, Zod schemas, field validation |
| `error-handling` | Error boundaries, error states, API errors |
| `testing-patterns` | Vitest, Testing Library, mocks, E2E |
| `domain-config-patterns` | useSessionConfig, PublicRoleConfig, config-driven UI |
| `permission-patterns` | Role-based access, usePermissions, permission gates |
| `status-badge-patterns` | Status indicators, badge variants, status styling |
| `datatable-patterns` | Tables, row actions, bulk actions, pagination |
| `mutation-wrapper-patterns` | Mutations with toasts, cache invalidation |
| `media-services-patterns` | AudioWorklet, MediaRecorder, streaming |
| `security-patterns` | Auth, sensitive data, security measures |
| `feature-module-architecture` | Feature organization, module structure |

### Workflow Skills (Invoke when user requests)

| Trigger | Skill |
|---------|-------|
| "run TDD", "test-driven" | `test-driven-development` |
| "debug", "systematic debugging" | `systematic-debugging` |
| "brainstorm", "explore options" | `brainstorming` |
| "write a plan", "create plan" | `writing-plans` |
| "execute the plan" | `executing-plans` |
| "review code", "code review" | `requesting-code-review` |
| "parallelize", "run in parallel" | `dispatching-parallel-agents` |
| "finish branch", "merge" | `finishing-a-development-branch` |
| "verify before done" | `verification-before-completion` |

---

## Operating Rules

- Product docs (`ActualProduct.md`, `PRODUCTION-PRD.md`, `RoleInteractionSpec.md`) are the ultimate source of truth. If plans or trackers conflict, update docs before code.
- Build the full role-based, multi-scenario product; avoid interview-only assumptions.
- Preserve existing architecture; prefer additive changes and minimal refactors.
- Use configuration-driven modules and role-based permissions; never hardcode domain or role logic.
- **NO backward compatibility code**: No legacy fallbacks, deprecated paths, or migration shims. Delete unused code completely.

---

## Sprint Startup Ritual

Before writing code, complete in order:

1. **Read** `development-process/tracker/tasks.md` → identify current phase, unchecked tasks
2. **Check** for deferred tasks whose target phase has arrived (P0 priority)
3. **Pick work** using priority: P0 deferred → P1 failing tests → P2 in-progress → P3 next unchecked
4. **Read** relevant architecture docs from Documentation Index
5. **Check** relevant skills from Skills Index for patterns
6. **State approach** in 2-3 sentences before coding

---

## Quick Reference

### Commands

```bash
pnpm dev:web        # Start dev server
pnpm build:web      # Production build
pnpm test:web       # Unit tests
pnpm test:web:e2e   # E2E tests
pnpm lint:web       # ESLint
pnpm typecheck:web  # TypeScript
```

### Monorepo Structure

```
apps/web/src/
├── app/        # Router, providers
├── pages/      # Route components
├── features/   # Feature modules (auth, sessions, media, ai)
├── shared/     # Cross-cutting (ui, stores, services)
└── types/      # Domain types, API contracts

packages/
├── ui/         # @realtime/ui - Pure UI components
└── protocol/   # @realtime/protocol - WebSocket schemas
```

### Dependency Rules

```
app → features, shared, pages
pages → features, shared
features → shared, types
shared → types (NEVER features)
```

### Critical Patterns (Summary)

| Pattern | Rule | Skill |
|---------|------|-------|
| Config-driven UI | `useSessionConfig()` - never hardcode domain logic | `domain-config-patterns` |
| Permissions | `usePermissions()` - never hardcode role checks | `permission-patterns` |
| Server state | TanStack Query only - never Zustand for server data | `tanstack-query-patterns` |
| Client state | Zustand only - never TanStack Query for UI state | `zustand-state-management` |
| WebSocket | `subscribe()` typed handlers - never raw socket | `websocket-client` |
| API calls | Service layer + TanStack Query - never raw fetch | `api-service-patterns` |

### File Limits

| Type | Max Lines |
|------|-----------|
| Components | 300 |
| Hooks | 200 |
| Functions | 30 |
| All files | 600 |

### Import Order

```typescript
import { useState } from 'react';              // 1. React
import { useQuery } from '@tanstack/...';      // 2. External
import type { User } from '@/types';           // 3. Types
import { Button } from '@/shared/ui';          // 4. Shared
import { useAuth } from '@/features/auth';     // 5. Features
import { cn } from '@/shared/lib/utils';       // 6. Utils
```

---

## Definition of Done

Task is complete ONLY when ALL pass:

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

- [ ] TypeScript compiles, lint passes, tests pass
- [ ] No console.log or debug code
- [ ] Config-driven UI (no hardcoded domain logic)
- [ ] Role-based permissions (no hardcoded role checks)
- [ ] Accessibility: semantic HTML, keyboard support, ARIA
- [ ] File size limits respected
- [ ] `tracker/tasks.md` updated with `[x]`
- [ ] `tracker/changelog.md` entry added

---

## Standup Format

```
**Done:** [Task] - Brief description
**Files:** list of changed files
**Next:** [Task] or "awaiting confirmation"
**Blockers:** Issue or "None"
**Tests:** Status of verification commands
```
