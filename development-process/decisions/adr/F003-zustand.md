# ADR-F003: Use Zustand for Client State

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need client state management for real-time updates, UI state, and media state.

## Decision

Use Zustand for client state. TanStack Query handles server state.

## Consequences

### Positive
- Minimal boilerplate
- Built-in immer support
- `subscribeWithSelector` for fine-grained updates
- Works outside React components
- Good DevTools

### Negative
- Manual subscription management
- No built-in persistence (use middleware)

## Notes

- NEVER store server data in Zustand
- Use atomic selectors to prevent unnecessary re-renders
- Use `useShallow` for object selections
