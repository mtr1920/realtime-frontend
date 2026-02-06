# ADR-F007: Use Browser WebRTC APIs

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need real-time video/audio communication for sessions.

## Decision

Use native browser WebRTC APIs for P2P mesh. Consider mediasoup for larger sessions.

## Consequences

### Positive
- Direct P2P connections (low latency)
- No server media relay for small sessions
- Standard browser APIs
- Full control over implementation

### Negative
- P2P mesh doesn't scale beyond ~6 participants
- Need TURN servers for NAT traversal
- Complex state management

## Notes

Current implementation uses P2P mesh. Plan for SFU (mediasoup) when scaling.
