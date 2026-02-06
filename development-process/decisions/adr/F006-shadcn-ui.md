# ADR-F006: Use shadcn/ui Components

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need accessible, customizable UI components.

## Decision

Use shadcn/ui with Radix UI primitives.

## Consequences

### Positive
- Radix primitives for accessibility
- Copy-paste ownership model
- Tailwind CSS integration
- CVA for variants
- Full customization control

### Negative
- Manual updates (not npm package)
- Some components need customization

## Notes

Components are in `packages/ui/`. Customize in place.
