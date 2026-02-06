---
title: "1. Decision Log"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 1. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 | Latest stable, concurrent features, Server Components ready |
| Build Tool | Vite | Fast HMR, native ESM, excellent DX |
| State Management | Zustand + TanStack Query | Simple global state + powerful server state |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, consistent design system |
| Forms | React Hook Form + Zod | Type-safe validation, excellent performance |
| Routing | TanStack Router | Type-safe routing, loader patterns |
| WebSocket | Native WebSocket + custom hooks | Full control, protocol compliance |
| WebRTC | Native APIs + mediasoup-client | SFU integration, recording support |
| Audio Processing | Web Audio API + AudioWorklet | Low-latency AI audio streaming |
| AI Actor Configuration | Domain-configured actor profiles (persona/voice/avatar) | Supports interviewer, pre-sales manager, people manager without code changes |
| Recording Composition | MediaRecorder + Web Audio mixing + chunked upload | Mix AI avatar audio with screen recording and persist to backend |
| Observer Mode | Role-based spectator with restricted publish permissions | Enables observation without disrupting sessions |
| Outcomes UI | Role-gated summaries/evaluations/decisions | Keeps outcome visibility aligned with session roles |
| Integration Surfaces | Connector-driven sync + status panels | Supports HRMS/CRM exports without custom UI forks |
| Legacy Profile Parity | Config-driven interview profile (ai-interview reference) | Preserve proven interview UX while keeping other domains first-class |
| Testing | Vitest + Testing Library + Playwright | Fast unit tests, E2E coverage |
| i18n | react-i18next | Industry standard, lazy loading |
| Icons | Lucide React | Consistent, tree-shakeable |
| Animation | Framer Motion | Production-grade animations, reduced motion support |
| Theming | CSS Variables + Context | Minimal re-renders, multi-tenant customization |

---
