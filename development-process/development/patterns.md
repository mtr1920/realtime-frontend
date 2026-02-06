# Implementation Patterns

## Overview

Implementation patterns are documented in `.claude/skills/` directories. Each skill contains detailed code examples and critical rules.

## Skills Reference

| Pattern | Skill | Key Topics |
|---------|-------|------------|
| **React 19** | [react-patterns](../../.claude/skills/react-patterns/) | useTransition, useDeferredValue, useOptimistic, use(), React Compiler |
| **Config-Driven UI** | [domain-config-patterns](../../.claude/skills/domain-config-patterns/) | useSessionConfig, isModuleEnabled, permissions |
| **Server State** | [tanstack-query-patterns](../../.claude/skills/tanstack-query-patterns/) | useSuspenseQuery, mutations, optimistic updates |
| **Client State** | [zustand-state-management](../../.claude/skills/zustand-state-management/) | Stores, selectors, subscribeWithSelector |
| **WebSocket** | [websocket-client](../../.claude/skills/websocket-client/) | Message envelopes, subscribe, reconnection |
| **WebRTC** | [webrtc-media](../../.claude/skills/webrtc-media/) | Peer connections, media streams, devices |
| **UI Components** | [ui-component-patterns](../../.claude/skills/ui-component-patterns/) | Radix UI, CVA variants, accessibility |
| **Forms** | [form-validation](../../.claude/skills/form-validation/) | react-hook-form, Zod schemas |
| **Errors** | [error-handling](../../.claude/skills/error-handling/) | ErrorBoundary, toast notifications |
| **Security** | [security-patterns](../../.claude/skills/security-patterns/) | Token storage, XSS prevention |
| **Routing** | [routing-patterns](../../.claude/skills/routing-patterns/) | TanStack Router, protected routes |
| **API** | [api-service-patterns](../../.claude/skills/api-service-patterns/) | Service layer, query keys |
| **Testing** | [testing-patterns](../../.claude/skills/testing-patterns/) | Vitest, Playwright, mocking |

## Pattern Categories

### Architecture Patterns

| Pattern | Use When |
|---------|----------|
| Feature-Sliced Design | Organizing feature modules |
| Dependency injection | Testing, service configuration |
| Barrel exports | Public API from feature modules |

### State Patterns

| Pattern | Use When |
|---------|----------|
| TanStack Query | Server state (API data) |
| Zustand | Client state (UI, real-time) |
| Context | Theme, auth, providers |
| URL state | Filters, pagination |

### Component Patterns

| Pattern | Use When |
|---------|----------|
| forwardRef | Ref-forwarding components |
| Compound components | Related component groups |
| Render props | Flexible rendering logic |
| Discriminated unions | Variant props |

### Performance Patterns

| Pattern | Use When |
|---------|----------|
| React 19 Compiler | Automatic memoization |
| useTransition | Expensive non-urgent updates |
| useDeferredValue | Expensive child renders |
| Suspense | Async data loading |
| Lazy loading | Route/component code splitting |

### Real-time Patterns

| Pattern | Use When |
|---------|----------|
| Message envelopes | WebSocket communication |
| Optimistic updates | Instant UI feedback |
| Queue + retry | Offline resilience |
| Exponential backoff | Reconnection |

## Quick Reference

### Config-Driven Rendering

```typescript
const { isModuleEnabled, permissions } = useSessionConfig();

// Module check
{isModuleEnabled('ai') && <AIControls />}

// Permission check
{permissions.canEndSession && <EndButton />}
```

### State Management

```typescript
// Server state - TanStack Query
const { data } = useSuspenseQuery({
  queryKey: queryKeys.sessions.detail(id),
  queryFn: () => sessionService.get(id),
});

// Client state - Zustand
const phase = useSessionStore((s) => s.phase);
```

### WebSocket

```typescript
const { subscribe, emit } = useWebSocket();

useEffect(() => {
  const unsub = subscribe('session.snapshot', (msg) => {
    sessionStore.setSession(msg.payload);
  });
  return unsub;
}, [subscribe]);
```

### Error Handling

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Skeleton />}>
    <SessionDetails sessionId={id} />
  </Suspense>
</ErrorBoundary>
```

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Hardcode domain logic | Use `isModuleEnabled()` |
| Check role names | Use `hasPermission()` |
| Store server data in Zustand | Use TanStack Query |
| Manual memoization | Let React 19 Compiler handle it |
| Direct fetch() | Use service layer |
| Inline styles | Use Tailwind classes |

## Related Documentation

- [Architecture Overview](../model/architecture-overview.md)
- [Coding Standards](./coding-standards.md)
- [State Management](../model/state-management.md)
