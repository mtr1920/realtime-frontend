# ADR-F008: Use AudioWorklet for Audio Processing

**Status:** Accepted
**Date:** 2026-01-15

## Context

Need real-time audio processing for AI voice interaction.

## Decision

Use AudioWorklet API for audio capture and processing.

## Consequences

### Positive
- Runs on audio rendering thread (low latency)
- No main thread blocking
- Full control over sample processing
- Can process at exact sample rate (16kHz)

### Negative
- Requires separate worklet file
- More complex than ScriptProcessorNode
- Not supported in older browsers

## Notes

Worklet at `/public/audio-processor.worklet.js` processes PCM16 at 16kHz for AI input.
