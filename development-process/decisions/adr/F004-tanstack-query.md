# ADR-F004: Use TanStack Query for Server State

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need caching, background updates, and optimistic mutations for API data.

## Decision

Use TanStack Query v5 for all server state.

## Consequences

### Positive
- Automatic caching and invalidation
- Suspense integration with `useSuspenseQuery`
- Built-in loading/error states
- Optimistic updates
- Devtools

### Negative
- Learning curve for query key management
- Additional bundle size (~15KB)

## Notes

- Use query key factory pattern
- Prefer `useSuspenseQuery` for cleaner code
- Implement optimistic updates for mutations
