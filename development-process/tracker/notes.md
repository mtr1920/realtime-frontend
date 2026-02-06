# Notes & Blockers

## Current Blockers
- Waiting for backend API service completion (Phase 2)
- Waiting for backend realtime service completion (Phase 3)

## Dependencies on Backend

| Frontend Phase | Requires Backend Phase |
|---------------|----------------------|
| Phase 2 (Auth) | Backend Phase 2.2 (Auth) |
| Phase 3 (Session) | Backend Phase 2.5 (Session Provisioning) |
| Phase 3 (WebSocket) | Backend Phase 3 (Realtime Service) |
| Phase 4 (WebRTC) | Backend Phase 3.5 (RTC Signaling) |
| Phase 5 (AI) | Backend Phase 4 (AI Integration) |
| Phase 6 (Compliance) | Backend Phase 5.5 (Compliance Module) + Recording storage |
| Phase 7 (Admin) | Backend Phase 2.3-2.4, 5.1-5.2 |
| Phase 7 (Outcomes/Integrations) | Backend Phase 5.6-5.7 |

## Notes
- Follow component architecture strictly
- All tenant-scoped API calls must include tenant context
- Use shared types from @protocol package
- Test WebRTC on multiple browsers
- Audio processing must maintain low latency for AI
- Legacy interview app reference: `/home/mtr/Projects/ai-interview` (one domain profile, not the only mode)
- Backend plan reference: `/home/mtr/Projects/RealtimeApp/realtime-backend/development-process/plans`
- Recording mix/upload depends on backend `recording.finalized` + storage endpoints
- Align all UX decisions with `/home/mtr/Projects/RealtimeApp/Docs/ActualProduct.md`
- **REFACTOR LARGE FILES** - Files over 600 lines need immediate attention:
  - `messages.ts` (845 lines) - Break into separate type files per domain
  - `websocket.service.ts` (729 lines) - Extract connection management, message handlers
  - `AIActorForm.tsx` (631 lines) - Split into smaller components
  - `audio-capture.service.test.ts` (660 lines) - Break into focused test files
  - Large files indicate architectural debt and future maintenance issues
  - Break into smaller, focused modules with single responsibilities

---

*Last Updated: 2026-01-19*
