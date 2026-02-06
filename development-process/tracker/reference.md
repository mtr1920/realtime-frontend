# Frontend Reference

**Project:** Multi-tenant, Role-Agnostic Realtime Platform - Web Application
**Version:** 1.0
**Created:** 2026-01-15

---

## Quick Reference

```bash
# Development Commands
pnpm install              # Install dependencies
pnpm dev:web              # Start web app in dev mode
pnpm build:web            # Build web app
pnpm test:web             # Run web app tests
pnpm test:web:e2e         # Run E2E tests
pnpm lint:web             # Lint web app
pnpm typecheck:web        # TypeScript checking
```

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 6.x | Build Tool |
| TanStack Router | 1.x | Routing |
| TanStack Query | 5.x | Server State |
| Zustand | 5.x | Client State |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | UI Components |
| mediasoup-client | 3.x | WebRTC SFU |
| Vitest | 2.x | Unit Testing |
| Playwright | 1.x | E2E Testing |
| Framer Motion | 11.x | Animations |
| axe-core | 4.x | Accessibility Testing |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/home/mtr/Projects/RealtimeApp/Docs/ActualProduct.md` | Product vision and scope (source of truth) |
| `CLAUDE.md` | Claude Code guidance |
| `development-process/index.md` | Documentation index |
| `development-process/tracker/tasks.md` | Primary task tracker |
| `/home/mtr/Projects/RealtimeApp/realtime-backend/development-process/plans/07-data-flows/session-invitation-flow.md` | Role-aware invitation/onboarding flow for entry screens |
| `apps/web/src/app/main.tsx` | Application entry point |
| `apps/web/src/app/router/index.tsx` | Route definitions |
| `apps/web/src/shared/stores/` | Zustand stores |
| `apps/web/src/shared/services/` | API/WebSocket services |
| `apps/web/vite.config.ts` | Vite configuration |
| `apps/web/tailwind.config.ts` | Tailwind configuration |
| `packages/ui/` | Shared UI components + tokens |

---

*Last Updated: 2026-01-16*
