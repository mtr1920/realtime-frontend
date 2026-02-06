# ADR-F009: Use CSS Variables for Theming

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need theme switching without runtime overhead.

## Decision

Use CSS custom properties (variables) for all theme values.

## Consequences

### Positive
- No runtime JavaScript overhead
- Instant theme switching
- SSR-friendly (no hydration mismatch)
- Works with Tailwind CSS
- Native browser support

### Negative
- Limited computed values
- No TypeScript type checking

## Notes

Theme values defined in `:root` and `.dark` selectors. Tailwind references via `var()`.
