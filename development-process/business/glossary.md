# Frontend Glossary

## UI & Components

| Term | Definition |
|------|------------|
| **Primitive** | Unstyled, accessible base component from Radix UI (Dialog, Popover) |
| **Component** | Styled, reusable UI element (Button, Card, Input) |
| **Feature Component** | Domain-specific component (VideoTile, TranscriptEntry) |
| **Layout Component** | Page structure element (Sidebar, Header, PageLayout) |
| **Composite** | Feature combinations (SessionRoom, AdminDashboard) |

## State Management

| Term | Definition |
|------|------------|
| **Store** | Zustand state container for client state |
| **Query** | TanStack Query hook for server state (`useQuery`, `useSuspenseQuery`) |
| **Mutation** | TanStack Query hook for server modifications (`useMutation`) |
| **Query Key** | Hierarchical identifier for cache management |
| **Selector** | Function extracting specific state slice from store |
| **Optimistic Update** | UI update before server confirmation |

## Architecture

| Term | Definition |
|------|------------|
| **FSD** | Feature-Sliced Design - architecture methodology |
| **Composition Root** | `app/` directory containing providers and router |
| **Feature Module** | Self-contained feature in `features/` (auth, session, media) |
| **Shared Layer** | Cross-cutting concerns in `shared/` (ui, hooks, stores) |
| **Barrel Export** | `index.ts` file exposing public API |

## Real-Time

| Term | Definition |
|------|------------|
| **Message Envelope** | Wrapper containing metadata (v, type, id, seq, ts, payload) |
| **Server Sequence** | Monotonic counter for message ordering |
| **Client Sequence** | Client-side message counter |
| **Heartbeat** | Periodic ping/pong for connection health |
| **Resume** | Reconnection with missed event replay |

## Media

| Term | Definition |
|------|------------|
| **Local Stream** | User's camera/microphone MediaStream |
| **Remote Stream** | Other participant's MediaStream |
| **Track** | Individual audio or video MediaStreamTrack |
| **P2P Mesh** | Direct peer connections between participants |
| **SFU** | Selective Forwarding Unit (server-mediated media) |
| **ICE** | Interactive Connectivity Establishment for NAT traversal |

## AI Integration

| Term | Definition |
|------|------------|
| **AI Actor** | Configured AI persona with voice, avatar, capabilities |
| **Turn** | Speaking segment in conversation (user or AI) |
| **VAD** | Voice Activity Detection |
| **Audio Chunk** | Buffer of PCM audio samples |
| **Transcript Entry** | Text representation of spoken content |

## Session

| Term | Definition |
|------|------------|
| **Participant** | User in a session with role and permissions |
| **Facilitator** | Participant with elevated control permissions |
| **Observer** | Read-only spectator without publish rights |
| **Session Phase** | Current stage (waiting, active, completed) |
| **Snapshot** | Full session state at connection time |

## Compliance

| Term | Definition |
|------|------------|
| **Browser Lock** | Detection of tab/window switches |
| **Identity Challenge** | Verification prompt during session |
| **Violation** | Detected compliance breach with severity |
| **Integrity Report** | Summary of compliance events |

## Role-Agnostic Mappings

Frontend terms map to backend concepts without domain-specific names:

| Frontend | Backend | Note |
|----------|---------|------|
| AI Actor | Role Runtime Config | Configured per domain |
| Permission | Role Definition | From PublicRoleConfig |
| Module | Module Config | Enabled per domain |
| Flow Stage | Conversation Flow | Optional structured flow |

## Packages

| Package | Purpose |
|---------|---------|
| `@realtime/ui` | Shared component library |
| `@realtime/protocol` | WebSocket message types |
| `apps/web` | Main web application |

## Related Documentation

- [Architecture Overview](../model/architecture-overview.md)
- [Backend Glossary](../../../realtime-backend/development-process/business/glossary.md)
