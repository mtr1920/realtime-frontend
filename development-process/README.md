# Development Process (BMAD Methodology)

This directory contains all frontend development documentation organized using the BMAD methodology:
**B**usiness - **M**odel - **A**PI - **D**evelopment.

## Quick Navigation

| Section | Purpose | Key Files |
|---------|---------|-----------|
| [Business](./business/) | Product vision, domain types, glossary | [Product Vision](./business/product-vision.md), [Domain Types](./business/domain-types.md) |
| [Model](./model/) | Architecture, components, pages, state | [Architecture](./model/architecture-overview.md), [Pages](./model/pages-and-routing.md), [Packages](./model/shared-packages.md) |
| [API](./api/) | REST client, WebSocket, WebRTC, AI | [REST Client](./api/rest-client.md), [WebSocket](./api/websocket-client.md) |
| [Development](./development/) | Standards, patterns, testing, deployment | [Standards](./development/coding-standards.md), [Patterns](./development/patterns.md) |
| [Tracker](./tracker/) | Tasks, changelog, backlog | [Tasks](./tracker/tasks.md), [Changelog](./tracker/changelog.md), [Backlog](./tracker/backlog.md) |
| [Decisions](./decisions/) | Technology choices, ADRs | [Decision Log](./decisions/decision-log.md), [ADRs](./decisions/adr/) |

---

## B - Business Context

Understanding the product and domain.

| File | Description |
|------|-------------|
| [product-vision.md](./business/product-vision.md) | Multi-tenant frontend vision and configuration-driven UI principles |
| [domain-types.md](./business/domain-types.md) | How PublicRoleConfig drives UI, supported domains |
| [glossary.md](./business/glossary.md) | Frontend terminology and role-agnostic mappings |

---

## M - Model & Architecture

System design and data models.

| File | Description |
|------|-------------|
| [architecture-overview.md](./model/architecture-overview.md) | Monorepo structure, Feature-Sliced Design, dependency rules |
| [component-architecture.md](./model/component-architecture.md) | Component categories, patterns, @realtime/ui package |
| [pages-and-routing.md](./model/pages-and-routing.md) | TanStack Router, page components, route protection |
| [shared-packages.md](./model/shared-packages.md) | @realtime/ui, @realtime/protocol, shared/ directory |
| [state-management.md](./model/state-management.md) | Zustand for client state, TanStack Query for server state |
| [data-flows.md](./model/data-flows.md) | Authentication, session join, AI interaction, recording flows |
| [config-rendering.md](./model/config-rendering.md) | useSessionConfig hook, module enablement, permission-based rendering |

---

## A - APIs & Protocols

External interfaces and communication.

| File | Description |
|------|-------------|
| [rest-client.md](./api/rest-client.md) | API client setup, service layer, TanStack Query integration |
| [websocket-client.md](./api/websocket-client.md) | WebSocketService, message envelopes, reconnection |
| [webrtc-integration.md](./api/webrtc-integration.md) | P2P mesh, device management, screen share |
| [ai-client.md](./api/ai-client.md) | Audio capture/playback services, AI session hook |

---

## D - Development Process

How we build and maintain the frontend.

| File | Description |
|------|-------------|
| [coding-standards.md](./development/coding-standards.md) | File limits, component patterns, import order |
| [patterns.md](./development/patterns.md) | Links to all .claude/skills/, pattern summary |
| [testing-strategy.md](./development/testing-strategy.md) | Vitest, Playwright, E2E coverage |
| [deployment.md](./development/deployment.md) | Build commands, environment variables, Vite config |

---

## Tracker

Current development status and history.

| File | Description |
|------|-------------|
| [tasks.md](./tracker/tasks.md) | Current phase status and active tasks |
| [backlog.md](./tracker/backlog.md) | Future work items, deferred tasks, technical debt |
| [changelog.md](./tracker/changelog.md) | Recent change history |
| [metrics.md](./tracker/metrics.md) | Test counts, coverage, build size |
| [reference.md](./tracker/reference.md) | Quick command reference |

---

## Decisions

Architectural decisions and technology choices.

| File | Description |
|------|-------------|
| [decision-log.md](./decisions/decision-log.md) | Technology stack rationale |
| [adr/](./decisions/adr/) | Architecture Decision Records (F001-F016) |

---

## Related Documentation

| Location | Purpose |
|----------|---------|
| [CLAUDE.md](../CLAUDE.md) | AI assistant guidance and rules |
| [.claude/skills/](../.claude/skills/) | Implementation pattern guides |
| [Backend Docs](../../realtime-backend/development-process/) | Backend BMAD documentation |
| [ActualProduct.md](../../Docs/ActualProduct.md) | Product vision (source of truth) |

---

## How to Use This Documentation

### Tracker Workflow

| File | Purpose | When to Update |
|------|---------|----------------|
| `tasks.md` | **Current work only** - active phase tasks | Start/complete tasks, daily |
| `backlog.md` | **Future work** - deferred items, tech debt | Add new items, phase planning |
| `changelog.md` | **History** - what changed and when | After each meaningful change |
| `metrics.md` | **Quality dashboard** - test counts, coverage | After test runs |

### Task Lifecycle

1. **New work arrives** → Add to `backlog.md` under appropriate phase
2. **Phase begins** → Move items from `backlog.md` to `tasks.md`
3. **Work starts** → Mark task `[ ]` in tasks.md
4. **Work completes** → Mark `[x]`, update changelog
5. **Phase ends** → Archive completed, deferred items go to `backlog.md`

### Phase Gates

Before advancing to the next phase:
1. All tasks in current phase marked complete
2. Gate criteria table shows ✅ for all items
3. Deferred items documented in backlog.md with target phase
4. Changelog updated with phase completion entry

---

## Document Guidelines

Each document in this structure follows these principles:

1. **Concise**: 200-500 lines, scannable with tables and headers
2. **Linked**: References detailed sources rather than duplicating
3. **Current**: Updated as the system evolves
4. **Actionable**: Provides clear guidance for implementation
