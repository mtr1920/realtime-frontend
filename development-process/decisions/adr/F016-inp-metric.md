# ADR-F016: Target INP < 200ms

**Status:** Accepted
**Date:** 2026-01-15

## Context

Google replaced FID with INP (Interaction to Next Paint) in Core Web Vitals.

## Decision

Target INP < 200ms for "Good" rating.

## Consequences

### Positive
- Better user experience measurement
- Captures all interactions, not just first
- Aligns with Google ranking factors
- More comprehensive than FID

### Negative
- Harder to achieve than FID
- Requires attention to all interactions

## Notes

Use `useTransition` and `useDeferredValue` to keep interactions responsive. Profile with Chrome DevTools Performance panel.
