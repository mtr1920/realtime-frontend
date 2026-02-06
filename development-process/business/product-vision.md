# Frontend Product Vision

## Overview

The frontend is a **multi-tenant, role-agnostic web application** that dynamically adapts to different business domains through configuration-driven rendering. The same codebase serves interview platforms, pre-sales assistants, HR review tools, and customer support interfaces.

## Core Principles

### 1. Configuration-Driven UI

Components render based on domain configuration, not hardcoded logic:

```typescript
// ✅ CORRECT: Config-driven
const { isModuleEnabled } = useSessionConfig();
{isModuleEnabled('ai') && <AIControls />}

// ❌ WRONG: Hardcoded domain
if (domainType === 'interview') { <InterviewControls /> }
```

### 2. Role-Agnostic Permissions

UI elements check permissions from role definitions, never role names:

```typescript
// ✅ CORRECT: Permission-based
const { hasPermission } = usePermissions();
{hasPermission('canEndSession') && <EndButton />}

// ❌ WRONG: Role name check
if (role === 'facilitator') { <EndButton /> }
```

### 3. Multi-Tenant & Client HRMS Integration

Tenant context propagates through all API calls. The platform integrates with client HRMS portals via:
- **API integration** (on-demand fetch)
- **Direct database integration** (read-only or replicated)
- **Hybrid integration** (API + database + synced local storage)

Client-generated session UUIDs are the canonical session IDs used in API paths and join links.

### 4. Session-ID-Driven Resolution

When a user joins via a client-provided link:
1. Frontend extracts the session ID from the URL
2. Backend resolves full session configuration from the integration source
3. Configuration includes AI behavior, flow rules, proctoring settings, and context

### 5. Real-Time First

WebSocket connections drive session state with automatic reconnection and message queuing.

### 5. Type-Safe Throughout

Shared types with backend via `@realtime/protocol` package. Zod validation at boundaries.

### 6. Accessible & Responsive

WCAG 2.1 AA compliant. Mobile-first design. Reduced motion support.

## Key Features

| Feature | Description |
|---------|-------------|
| **Session Management** | Create, join, observe sessions with role-based controls |
| **Media & WebRTC** | Video grid, screen share, device selection |
| **AI Integration** | Voice interaction with configurable AI actors |
| **Compliance** | Browser lock, identity challenges, recording consent |
| **Recording** | Screen + mic + AI audio mix, chunked upload |
| **Outcomes** | Summaries, evaluations, decisions by role |
| **Integrations** | Connector management, sync status |
| **Admin** | Tenant settings, user management, domain configs |

## Domain Profiles

The same UI supports multiple domain profiles through configuration:

| Domain | AI Actor Role | Key Features |
|--------|--------------|--------------|
| Interview | Interviewer | Screen share required, compliance, evaluation |
| Pre-Sales | Discovery Specialist | Qualification, CRM integration |
| HR Review | Manager | 360 feedback, performance outcomes |
| Support | Assistant | Ticket integration, resolution tracking |

Each profile is a configuration preset, not a separate code path.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript 5.x |
| Build | Vite |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Styling | Tailwind CSS |
| Components | shadcn/ui + Radix UI |
| Routing | TanStack Router |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Playwright |

## Related Documentation

- [ActualProduct.md](../../../Docs/ActualProduct.md) - Product vision source of truth
- [Backend Product Vision](../../../realtime-backend/development-process/business/product-vision.md)
- [Domain Types](./domain-types.md) - How PublicRoleConfig drives UI
