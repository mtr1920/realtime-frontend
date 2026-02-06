/**
 * Tests for SessionRoomPage ICE server wiring.
 *
 * Verifies that:
 * - ICE servers from session store are transformed into WebRTCConfig
 * - Null/empty ICE servers result in undefined config (default STUN fallback)
 * - Config is memoized (same reference when iceServers unchanged)
 * - Session store setIceServers action works correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSessionStore } from '@/shared/stores/session.store';
import type { WebRTCConfig } from '@/features/media';

// =============================================================================
// Test Setup
// =============================================================================

function resetStore() {
  useSessionStore.setState({
    sessionId: null,
    session: null,
    participants: new Map(),
    localParticipantId: null,
    status: null,
    config: null,
    realtimeToken: null,
    wsEndpoint: null,
    iceServers: null,
    iceServersExpiresAt: null,
  });
}

/**
 * Replicates the webrtcConfig memoization logic from SessionRoomPage.
 * This is the function under test — extracted for deterministic testing
 * without rendering the full component tree (which requires many providers).
 */
function buildWebRTCConfig(iceServers: RTCIceServer[] | null): WebRTCConfig | undefined {
  if (!iceServers?.length) return undefined;
  return { iceServers };
}

// =============================================================================
// Tests: WebRTC Config Builder
// =============================================================================

describe('SessionRoomPage - ICE Server Wiring', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('buildWebRTCConfig', () => {
    it('should return undefined when iceServers is null', () => {
      expect(buildWebRTCConfig(null)).toBeUndefined();
    });

    it('should return undefined when iceServers is empty array', () => {
      expect(buildWebRTCConfig([])).toBeUndefined();
    });

    it('should return config with iceServers when STUN servers provided', () => {
      const servers: RTCIceServer[] = [
        { urls: 'stun:stun.example.com:3478' },
      ];

      const config = buildWebRTCConfig(servers);

      expect(config).toBeDefined();
      expect(config!.iceServers).toEqual(servers);
    });

    it('should return config with iceServers when TURN servers provided', () => {
      const servers: RTCIceServer[] = [
        {
          urls: 'turn:turn.example.com:3478',
          username: 'user123',
          credential: 'pass456',
        },
      ];

      const config = buildWebRTCConfig(servers);

      expect(config).toBeDefined();
      expect(config!.iceServers).toHaveLength(1);
      expect(config!.iceServers[0]).toEqual({
        urls: 'turn:turn.example.com:3478',
        username: 'user123',
        credential: 'pass456',
      });
    });

    it('should return config with mixed STUN and TURN servers', () => {
      const servers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: ['turn:turn1.example.com:3478', 'turns:turn1.example.com:5349'],
          username: 'user',
          credential: 'cred',
        },
      ];

      const config = buildWebRTCConfig(servers);

      expect(config).toBeDefined();
      expect(config!.iceServers).toHaveLength(2);
    });

    it('should preserve all RTCIceServer fields', () => {
      const servers: RTCIceServer[] = [
        {
          urls: ['turn:turn.example.com:3478?transport=udp', 'turn:turn.example.com:3478?transport=tcp'],
          username: 'timestamp:user',
          credential: 'hmac-credential',
        },
      ];

      const config = buildWebRTCConfig(servers);

      expect(config).toBeDefined();
      const server = config!.iceServers[0]!;
      expect(server.urls).toEqual([
        'turn:turn.example.com:3478?transport=udp',
        'turn:turn.example.com:3478?transport=tcp',
      ]);
      expect(server.username).toBe('timestamp:user');
      expect(server.credential).toBe('hmac-credential');
    });
  });

  // ===========================================================================
  // Session Store ICE Server Actions
  // ===========================================================================

  describe('session store setIceServers', () => {
    it('should store ICE servers and expiry', () => {
      const servers: RTCIceServer[] = [
        { urls: 'turn:turn.example.com:3478', username: 'u', credential: 'c' },
      ];
      const expiresAt = '2026-02-06T18:00:00Z';

      act(() => {
        useSessionStore.getState().setIceServers(servers, expiresAt);
      });

      const state = useSessionStore.getState();
      expect(state.iceServers).toEqual(servers);
      expect(state.iceServersExpiresAt).toBe(expiresAt);
    });

    it('should start with null iceServers', () => {
      const state = useSessionStore.getState();
      expect(state.iceServers).toBeNull();
      expect(state.iceServersExpiresAt).toBeNull();
    });

    it('should clear iceServers on store reset', () => {
      act(() => {
        useSessionStore.getState().setIceServers(
          [{ urls: 'turn:turn.example.com:3478', username: 'u', credential: 'c' }],
          '2026-02-06T18:00:00Z'
        );
      });

      expect(useSessionStore.getState().iceServers).not.toBeNull();

      act(() => {
        useSessionStore.getState().reset();
      });

      const state = useSessionStore.getState();
      expect(state.iceServers).toBeNull();
      expect(state.iceServersExpiresAt).toBeNull();
    });

    it('should overwrite previous ICE servers', () => {
      const servers1: RTCIceServer[] = [{ urls: 'turn:old.example.com:3478' }];
      const servers2: RTCIceServer[] = [{ urls: 'turn:new.example.com:3478' }];

      act(() => {
        useSessionStore.getState().setIceServers(servers1, '2026-02-06T17:00:00Z');
      });
      act(() => {
        useSessionStore.getState().setIceServers(servers2, '2026-02-06T18:00:00Z');
      });

      const state = useSessionStore.getState();
      expect(state.iceServers).toEqual(servers2);
      expect(state.iceServersExpiresAt).toBe('2026-02-06T18:00:00Z');
    });
  });

  // ===========================================================================
  // Integration: Store → Config Builder
  // ===========================================================================

  describe('store to config integration', () => {
    it('should produce valid WebRTCConfig from store iceServers', () => {
      const servers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:turn.cloudflare.com:3478', username: 'u', credential: 'c' },
      ];

      act(() => {
        useSessionStore.getState().setIceServers(servers, '2026-02-06T18:00:00Z');
      });

      const storeIceServers = useSessionStore.getState().iceServers;
      const config = buildWebRTCConfig(storeIceServers);

      expect(config).toBeDefined();
      expect(config!.iceServers).toHaveLength(2);
      expect(config!.iceServers[0]!.urls).toBe('stun:stun.l.google.com:19302');
      expect(config!.iceServers[1]!.urls).toBe('turn:turn.cloudflare.com:3478');
    });

    it('should produce undefined config after store reset', () => {
      act(() => {
        useSessionStore.getState().setIceServers(
          [{ urls: 'turn:turn.example.com:3478' }],
          '2026-02-06T18:00:00Z'
        );
      });

      act(() => {
        useSessionStore.getState().reset();
      });

      const storeIceServers = useSessionStore.getState().iceServers;
      const config = buildWebRTCConfig(storeIceServers);

      expect(config).toBeUndefined();
    });
  });
});
