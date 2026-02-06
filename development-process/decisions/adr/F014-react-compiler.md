# ADR-F014: Enable React Compiler

**Status:** Accepted
**Date:** 2026-01-15

## Context

React 19 introduces the React Compiler for automatic memoization.

## Decision

Enable React Compiler in production builds.

## Consequences

### Positive
- Automatic memoization of components and hooks
- No manual `useMemo`, `useCallback`, `React.memo`
- Reduced boilerplate
- Better performance by default

### Negative
- Experimental feature
- Some edge cases may not optimize correctly
- Debugging optimizations is harder

## Notes

Do NOT manually memoize unless profiling shows specific need. Trust the compiler.
