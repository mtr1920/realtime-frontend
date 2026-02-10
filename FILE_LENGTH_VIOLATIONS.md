# File Length Violations

Generated: 2026-02-08

Enforcement thresholds:

- **Source files**: 600 lines (ESLint error)
- **Test files**: 900 lines (ESLint warn)
- **Type/protocol files**: 800 lines (ESLint warn)
- **Generated files**: Exempt

---

## Source Files > 600 Lines (MUST Refactor)

| Lines | File                                                                      | Suggested Split                                                               |
| ----- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 730   | `apps/web/src/features/realtime/services/websocket.service.ts`            | Extract message handlers by domain (session, media, ai) into separate modules |
| 726   | `apps/web/src/features/sessions/components/wizard/SessionWizard.tsx`      | Extract wizard steps into separate components, lift shared state to context   |
| 631   | `apps/web/src/features/ai/components/AIActorForm.tsx`                     | Extract form sections into sub-components                                     |
| 622   | `apps/web/src/features/media/services/webrtc.service.ts`                  | Extract peer connection management and signaling into separate modules        |
| 601   | `apps/web/src/features/sessions/components/detail/SessionOutcomesTab.tsx` | Extract outcome cards and scoring display into sub-components                 |

## Test Files > 900 Lines (SHOULD Refactor)

| Lines | File                                                                          |
| ----- | ----------------------------------------------------------------------------- |
| 919   | `apps/web/src/test/unit/features/realtime/services/websocket.service.test.ts` |

## Type/Protocol Files > 800 Lines (CONSIDER Splitting)

| Lines | File                                               | Suggested Split                                                  |
| ----- | -------------------------------------------------- | ---------------------------------------------------------------- |
| 1216  | `apps/web/src/features/realtime/types/messages.ts` | Split by message domain (session, media, ai, recording messages) |

---

## Summary

- **5 source files** exceed the 600-line error threshold
- **1 test file** exceeds the 900-line warn threshold
- **1 type file** exceeds the 800-line warn threshold
