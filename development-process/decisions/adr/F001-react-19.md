# ADR-F001: Use React 19

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need a modern UI framework with concurrent rendering, automatic optimization, and TypeScript support.

## Decision

Use React 19 as the UI framework.

## Consequences

### Positive
- React Compiler eliminates manual memoization
- `use()` hook for Suspense integration
- `useTransition` for non-blocking updates
- `useOptimistic` for instant UI feedback
- `useActionState` for form handling

### Negative
- Newer API, fewer community examples
- Some third-party libraries may need updates

## Notes

Leverage React 19 features:
- Don't manually use `useMemo`, `useCallback`, `React.memo`
- Use `useTransition` for expensive state updates
- Use `useSuspenseQuery` with Suspense boundaries
