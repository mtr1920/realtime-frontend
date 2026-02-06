# ADR-F010: Three-Layer Design Token Hierarchy

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need scalable, maintainable design system.

## Decision

Implement three-layer token hierarchy:
1. **Primitive tokens** - Raw values (colors, spacing)
2. **Semantic tokens** - Purpose-based (background, primary)
3. **Component tokens** - Component-specific (button-bg)

## Consequences

### Positive
- Clear separation of concerns
- Easy theme switching at semantic layer
- Component tokens for edge cases
- Maintainable as system grows

### Negative
- More tokens to manage
- Learning curve for contributors

## Notes

Tokens defined in `packages/ui/src/themes/`.
