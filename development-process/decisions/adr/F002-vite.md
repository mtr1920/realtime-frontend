# ADR-F002: Use Vite for Build Tooling

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need fast development server and optimized production builds.

## Decision

Use Vite as the build tool.

## Consequences

### Positive
- Near-instant HMR (<50ms)
- Native ESM development
- Rollup-based production builds
- Rich plugin ecosystem
- Built-in TypeScript support

### Negative
- Different dev/prod build systems
- Some CJS libraries need configuration

## Notes

Configure code splitting in `vite.config.ts` with `manualChunks`.
