# Technology Decision Log

## Overview

This document captures major technology decisions for the frontend application. Individual ADRs are in the `adr/` directory.

## Technology Stack Decisions

### Framework & Build

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 | Concurrent features, React Compiler, modern hooks |
| Build | Vite | Fast HMR, ESM-native, plugin ecosystem |
| Language | TypeScript 5.x | Type safety, IDE support |

### State Management

| Category | Choice | Rationale |
|----------|--------|-----------|
| Server State | TanStack Query v5 | Caching, background sync, Suspense support |
| Client State | Zustand | Minimal API, good devtools, immer support |
| URL State | TanStack Router | Type-safe routing, built-in search params |

### UI & Styling

| Category | Choice | Rationale |
|----------|--------|-----------|
| Component Library | shadcn/ui | Radix primitives, copy-paste ownership |
| Styling | Tailwind CSS | Utility-first, design tokens |
| Animations | Framer Motion | Declarative, reduced motion support |
| Theming | CSS Variables | No runtime overhead, SSR-friendly |

### Communication

| Category | Choice | Rationale |
|----------|--------|-----------|
| REST | Axios | Interceptors, TypeScript support |
| WebSocket | Native WebSocket | Direct control, custom protocol |
| WebRTC | Browser APIs | P2P mesh for small sessions |

### Testing

| Category | Choice | Rationale |
|----------|--------|-----------|
| Unit | Vitest | Fast, Vite-native, Jest-compatible |
| Component | Testing Library | User-centric testing philosophy |
| E2E | Playwright | Multi-browser, visual testing |

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Feature-Sliced Design | Clear boundaries, scalable structure |
| Configuration-driven UI | Multi-tenant flexibility |
| Permission-based rendering | Role-agnostic security |
| Separate UI package | Reusable component library |

## Performance Decisions

| Decision | Rationale |
|----------|-----------|
| React Compiler | Automatic memoization, less boilerplate |
| useSuspenseQuery | Cleaner loading states, Suspense integration |
| Route-based code splitting | Smaller initial bundle |
| INP < 200ms target | Modern Core Web Vitals |

## ADR Index

| ID | Decision | Status |
|----|----------|--------|
| [F001](./adr/F001-react-19.md) | Use React 19 | Accepted |
| [F002](./adr/F002-vite.md) | Use Vite | Accepted |
| [F003](./adr/F003-zustand.md) | Use Zustand | Accepted |
| [F004](./adr/F004-tanstack-query.md) | Use TanStack Query | Accepted |
| [F005](./adr/F005-tanstack-router.md) | Use TanStack Router | Accepted |
| [F006](./adr/F006-shadcn-ui.md) | Use shadcn/ui | Accepted |
| [F007](./adr/F007-webrtc.md) | Browser WebRTC APIs | Accepted |
| [F008](./adr/F008-audio-worklet.md) | Use AudioWorklet | Accepted |
| [F009](./adr/F009-css-variables.md) | CSS Variables theming | Accepted |
| [F010](./adr/F010-design-tokens.md) | Three-layer tokens | Accepted |
| [F011](./adr/F011-framer-motion.md) | Use Framer Motion | Accepted |
| [F012](./adr/F012-theme-modes.md) | Light/dark/high-contrast | Accepted |
| [F013](./adr/F013-phase-gates.md) | Phase gate validation | Accepted |
| [F014](./adr/F014-react-compiler.md) | React Compiler | Accepted |
| [F015](./adr/F015-suspense-query.md) | useSuspenseQuery | Accepted |
| [F016](./adr/F016-inp-metric.md) | INP metric target | Accepted |

## Related Documentation

- [Architecture Overview](../model/architecture-overview.md)
- [Backend Decision Log](../../../realtime-backend/development-process/decisions/decision-log.md)
