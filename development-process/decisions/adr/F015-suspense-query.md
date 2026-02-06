# ADR-F015: Use useSuspenseQuery Over useQuery

**Status:** Accepted
**Date:** 2026-01-15

## Context

TanStack Query v5 offers both `useQuery` and `useSuspenseQuery`.

## Decision

Prefer `useSuspenseQuery` for data fetching.

## Consequences

### Positive
- No loading state checks in component
- TypeScript knows data is defined
- Cleaner component code
- Natural Suspense boundary integration
- Error boundaries for errors

### Negative
- Requires Suspense boundary setup
- Different mental model
- Must handle loading at boundary level

## Notes

```typescript
// Component suspends, no loading check needed
const { data } = useSuspenseQuery({ ... });
// data is always defined here
```
