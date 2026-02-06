# Cross-Cutting Validation Gates

Run these validations after each phase to ensure quality across all dimensions.

## Theme Validation Matrix

| Theme | Visual Test | A11y Test | Status | Command |
|-------|-------------|-----------|--------|---------|
| Light | 🔴 | 🔴 | Not Started | `THEME=light pnpm test:web:visual && THEME=light pnpm test:web:a11y` |
| Dark | 🔴 | 🔴 | Not Started | `THEME=dark pnpm test:web:visual && THEME=dark pnpm test:web:a11y` |
| High Contrast | 🔴 | 🔴 | Not Started | `THEME=high-contrast pnpm test:web:visual && THEME=high-contrast pnpm test:web:a11y` |

## Responsive Validation Matrix

| Viewport | Size | Visual Test | Status | Command |
|----------|------|-------------|--------|---------|
| Mobile | 390x844 (iPhone 13) | ✅ | 12/12 tests pass | `npx playwright test --project=mobile` |
| Tablet | 768x1024 | 🔴 | Not Started | `pnpm test:web:visual --viewport=768,1024` |
| Desktop | 1280x800 | ✅ | 28/28 tests pass | `npx playwright test --project=chromium` |
| Large Desktop | 1920x1080 | 🔴 | Not Started | `pnpm test:web:visual --viewport=1920,1080` |

## Browser Compatibility Matrix

| Browser | E2E Pass | Status | Command |
|---------|----------|--------|---------|
| Chrome | ✅ | 28/28 pass | `npx playwright test --project=chromium` |
| Firefox | 🔴 | Needs browser install | `npx playwright test --project=firefox` |
| Safari | 🔴 | Needs system deps | `npx playwright test --project=webkit` |
| Edge | 🔴 | Not Started | `pnpm test:web:e2e --project=msedge` |

## Performance Budget (Core Web Vitals 2024)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | N/A | 🔴 |
| INP (Interaction to Next Paint) | < 200ms | N/A | 🔴 |
| CLS (Cumulative Layout Shift) | < 0.1 | N/A | 🔴 |
| Bundle Size (gzip) | < 250KB | N/A | 🔴 |
| Initial JS | < 150KB | N/A | 🔴 |

> **Note:** INP replaced FID as of March 2024. INP measures responsiveness across ALL interactions,
> not just the first. Use `useTransition` and `useDeferredValue` to improve INP scores.

**Validation Command:**
```bash
pnpm lighthouse:ci --config=lighthouse.config.js
```

## Full Validation Script

Run all validations for a given phase:
```bash
./scripts/validate-phase.sh <phase-number>

# Example: Validate Phase 1.5 (Theme System)
./scripts/validate-phase.sh 1.5
```

---

*Last Updated: 2026-01-15*
