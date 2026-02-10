# Contributing to Realtime Frontend

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
# Clone and install
git clone <repo-url>
cd realtime-frontend
cp .env.example .env    # Set VITE_API_URL to backend API
pnpm install

# Start development
pnpm dev:web
```

## Verification

Before submitting any changes, run all checks:

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description

- Detail 1
- Detail 2
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`, `revert`, `style`

**Scopes:** `web`, `ui`, `features/*`, `shared`, `protocol`, `config`, `deps`, `infra`

Commits are validated by commitlint via a `commit-msg` hook.

## Branch Naming

```
feat/TASK-XX-short-description
fix/TASK-XX-short-description
refactor/TASK-XX-short-description
chore/short-description
```

## Code Review Checklist

- [ ] TypeScript compiles (`pnpm typecheck:web`)
- [ ] Lint passes (`pnpm lint:web`)
- [ ] Tests pass (`pnpm test:web`)
- [ ] No `console.log` in production code
- [ ] No `any` types where avoidable
- [ ] Config-driven UI via `useSessionConfig()` — no hardcoded feature flags
- [ ] Role checks via `usePermissions()` — no string comparison on role names
- [ ] TanStack Query for server state, Zustand for client state only
- [ ] Feature-Sliced Design dependency rules respected
- [ ] File size limits: source < 600, components < 300, hooks < 200
- [ ] New features include unit tests
- [ ] `motion-safe:` prefix on CSS animations

## File Length Limits

| Category        | Max Lines | Enforcement  |
| --------------- | --------- | ------------ |
| Source files    | 600       | ESLint error |
| Test files      | 900       | ESLint warn  |
| Type files      | 800       | ESLint warn  |
| Generated files | Exempt    | —            |
| Components      | 300       | Convention   |
| Hooks           | 200       | Convention   |
| Functions       | 50        | ESLint warn  |
| Nesting depth   | 3         | ESLint error |
| Complexity      | 15        | ESLint warn  |
| Parameters      | 4         | ESLint warn  |

## Architecture

See `development-process/model/architecture-overview.md` for the Feature-Sliced Design structure and dependency rules.
