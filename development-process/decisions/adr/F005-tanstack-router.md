# ADR-F005: Use TanStack Router

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need type-safe routing with search params, loaders, and code splitting.

## Decision

Use TanStack Router for all routing.

## Consequences

### Positive
- Full TypeScript inference for routes and params
- Built-in search param management
- Route loaders for data prefetching
- File-based or code-based routes
- Suspense integration

### Negative
- Different API from React Router
- Smaller community than React Router

## Notes

Use route loaders for data prefetching on navigation.
