# @realtime/web

Multi-tenant, role-agnostic web application built with React 19, TypeScript 5.x, Vite, TanStack Query, Zustand, and Tailwind CSS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:web

# Run tests
pnpm test:web

# Build for production
pnpm build:web
```

## Architecture

```
apps/web/src/
├── app/              # Composition root (providers, router)
├── pages/            # Route page components
├── features/         # Feature modules (auth, sessions, media, ai, compliance)
├── shared/           # Cross-cutting concerns (ui, hooks, stores, services)
└── types/            # Centralized TypeScript types
```

See [CLAUDE.md](../../CLAUDE.md) for detailed architecture documentation.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start dev server |
| `pnpm build:web` | Production build |
| `pnpm test:web` | Run unit tests |
| `pnpm test:web:e2e` | Run E2E tests (Playwright) |
| `pnpm lint:web` | Run ESLint |
| `pnpm typecheck:web` | TypeScript checking |

## Testing

- **Unit Tests**: Vitest + Testing Library (1291 tests)
- **E2E Tests**: Playwright (50 passing)
- **Visual Tests**: Playwright screenshots
- **Accessibility**: axe-core integration

```bash
# Run all tests
pnpm test:web -- --run

# Run with coverage
pnpm test:web -- --coverage

# Run E2E tests
npx playwright test --project=chromium
```

## Documentation

- [Components](./docs/components.md) - UI component library
- [Hooks](./docs/hooks.md) - Custom hooks API
- [State Management](./docs/state-management.md) - Zustand stores and TanStack Query
