# Pending Media Integrations Plan

## Overview

This plan addresses the TODO items and placeholder code discovered in the WebRTC video integration, prioritized by user impact.

---

## Priority 1: Speaker Detection Integration ✅ COMPLETE

**Current State:** ~~`isSpeaking: false` is hardcoded in VideoGridContainer~~ DONE

**Goal:** Show visual indicator when participant is speaking

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `features/media/hooks/useAudioLevels.ts` | ✅ CREATED | Audio level detection hook |
| `features/media/hooks/useAudioLevels.test.ts` | ✅ CREATED | 12 unit tests |
| `features/media/services/audio-analyzer.service.ts` | ✅ CREATED | Web Audio API service |
| `features/sessions/components/room/VideoGridContainer.tsx` | ✅ MODIFIED | Wire speaking detection |
| `features/media/index.ts` | ✅ MODIFIED | Export new hook |

---

## Priority 2: Network Quality Display ✅ COMPLETE

**Current State:** ~~`quality: 'good'` is hardcoded, stats-monitor `getPeerStats` returns null~~ DONE

**Goal:** Show real network quality per participant

### Files Modified

| File | Action | Description |
|------|--------|-------------|
| `features/media/services/webrtc.service.ts` | ✅ MODIFIED | Added getStatsForPeer method |
| `features/media/services/stats-monitor.service.ts` | ✅ MODIFIED | Wired to WebRTC service |
| `features/sessions/components/room/VideoGridContainer.tsx` | ✅ MODIFIED | Wired network quality |
| `features/media/components/VideoGrid/VideoTile.tsx` | Already had UI | Quality indicator already existed |

---

## Priority 3: Chat Module (Placeholder)

**Current State:** Chat shows "Coming soon" placeholder

**Goal:** Basic real-time chat functionality

### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `features/chat/index.ts` | CREATE | Module exports |
| `features/chat/components/ChatPanel.tsx` | CREATE | Main chat UI |
| `features/chat/components/ChatMessage.tsx` | CREATE | Message display |
| `features/chat/components/ChatInput.tsx` | CREATE | Message input |
| `features/chat/hooks/useChat.ts` | CREATE | Chat state/actions |
| `features/chat/types.ts` | CREATE | Type definitions |
| `features/chat/components/*.test.tsx` | CREATE | Unit tests |

---

## Implementation Order

1. **Speaker Detection** - Highest visual impact, improves user experience
2. **Network Quality** - Important for debugging connection issues
3. **Chat** - Larger feature, requires backend integration

---

## Verification

```bash
pnpm typecheck:web && pnpm lint:web && pnpm test:web --run
```
