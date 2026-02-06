# ADR-F011: Use Framer Motion for Animations

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need declarative animations with reduced motion support.

## Decision

Use Framer Motion for animations.

## Consequences

### Positive
- Declarative animation API
- Built-in gesture support
- AnimatePresence for exit animations
- Easy reduced motion handling
- Layout animations

### Negative
- Bundle size (~30KB)
- Learning curve for complex animations

## Notes

Always check `prefers-reduced-motion` and disable/reduce animations accordingly.
