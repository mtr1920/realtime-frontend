# ADR-F012: Support Light/Dark/High-Contrast Modes

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need accessible theming for different user preferences.

## Decision

Support three theme modes:
1. **Light** - Default bright theme
2. **Dark** - Dark theme for low-light
3. **High Contrast** - Accessibility mode

## Consequences

### Positive
- WCAG 2.1 AA compliance
- User preference support
- System theme detection
- Persistent preference

### Negative
- More CSS to maintain
- Testing all modes

## Notes

Use `prefers-color-scheme` for system detection. Store preference in localStorage.
