/**
 * WebRTCService Tests — Core
 *
 * Tests for construction, lifecycle, connect/disconnect, multi-participant,
 * local streams, connection state events, and public API.
 *
 * See webrtc.service.signaling.test.ts for signaling handler tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  installMockRTCPeerConnection,
  uninstallMockRTCPeerConnection,
  resetPeerConnectionIdCounter,
} from '@/test/mocks/rtc-peer-connection.mock';
import type { MockRTCPeerConnection } from '@/test/mocks/rtc-peer-connection.mock';
import {
  MockMediaStream,
  MockMediaStreamTrack,
} from '@/test/mocks/media-devices.mock';

// Mock dependencies before importing the service
vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/features/realtime/services/websocket.service', () => ({
  getWebSocketService: vi.fn(() => null),
}));

import {
  WebRTCService,
  createWebRTCService,
  destroyWebRTCService,
  getWebRTCService,
} from '@/features/media/services/webrtc.service';
import type { PeerConnectionEvent } from '@/features/media/types/webrtc.types';

// =============================================================================
// Helpers
// =============================================================================

function createService(
  overrides: {
    localParticipantId?: string;
    isObserver?: boolean;
    onEvent?: (event: PeerConnectionEvent) => void;
  } = {}
): WebRTCService {
  return new WebRTCService({
    localParticipantId: overrides.localParticipantId ?? 'local-001',
    isObserver: overrides.isObserver ?? false,
    onEvent: overrides.onEvent,
  });
}

function getPeersMap(service: WebRTCService): Map<string, unknown> {
  return (service as unknown as { peers: Map<string, unknown> }).peers;
}

function getMockPC(peer: unknown): MockRTCPeerConnection {
  return (peer as unknown as { pc: MockRTCPeerConnection }).pc;
}

// =============================================================================
// Tests
// =============================================================================

describe('WebRTCService', () => {
  beforeEach(() => {
    resetPeerConnectionIdCounter();
    installMockRTCPeerConnection();
  });

  afterEach(() => {
    destroyWebRTCService();
    uninstallMockRTCPeerConnection();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Construction & Lifecycle
  // ===========================================================================

  describe('construction & lifecycle', () => {
    it('should create service with required options', () => {
      const service = createService();
      expect(service).toBeDefined();
      expect(getPeersMap(service).size).toBe(0);
    });

    it('should create service with observer mode', () => {
      const service = createService({ isObserver: true });
      expect(service).toBeDefined();
    });

    it('should stop and close all peers on stop()', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');
      expect(getPeersMap(service).size).toBe(2);

      service.stop();
      expect(getPeersMap(service).size).toBe(0);
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'disconnected', participantId: 'remote-001' })
      );
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'disconnected', participantId: 'remote-002' })
      );
    });
  });

  // ===========================================================================
  // Factory (Singleton)
  // ===========================================================================

  describe('factory', () => {
    it('should create and return a singleton service', () => {
      const service = createWebRTCService({ localParticipantId: 'local-001' });
      expect(getWebRTCService()).toBe(service);
    });

    it('should stop previous service when creating new one', () => {
      const service1 = createWebRTCService({ localParticipantId: 'local-001' });
      const stopSpy = vi.spyOn(service1, 'stop');

      createWebRTCService({ localParticipantId: 'local-002' });
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should destroy service and return null', () => {
      createWebRTCService({ localParticipantId: 'local-001' });
      destroyWebRTCService();
      expect(getWebRTCService()).toBeNull();
    });
  });

  // ===========================================================================
  // connectToParticipant
  // ===========================================================================

  describe('connectToParticipant', () => {
    it('should create PeerConnection for new participant', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      expect(getPeersMap(service).size).toBe(1);
      expect(getPeersMap(service).has('remote-001')).toBe(true);
    });

    it('should skip if already connected (idempotent)', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-001');
      expect(getPeersMap(service).size).toBe(1);
    });

    it('should add local tracks for non-observer', async () => {
      const service = createService();
      service.start();

      const stream = new MockMediaStream({
        audioTracks: [{ kind: 'audio' }],
        videoTracks: [{ kind: 'video' }],
      });
      service.setLocalStream(stream);

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      expect(mockPc.getSenders().length).toBeGreaterThan(0);
    });

    it('should NOT add local tracks for observer', async () => {
      const service = createService({ isObserver: true });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      expect(mockPc.getSenders().length).toBe(0);
    });

    it('should NOT initiate negotiation for observer', async () => {
      const service = createService({ isObserver: true });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      expect(mockPc.localDescription).toBeNull();
    });

    it('should initiate negotiation for non-observer', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      expect(mockPc.localDescription).not.toBeNull();
    });
  });

  // ===========================================================================
  // disconnectFromParticipant
  // ===========================================================================

  describe('disconnectFromParticipant', () => {
    it('should close peer and remove from map', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      expect(getPeersMap(service).size).toBe(1);

      service.disconnectFromParticipant('remote-001');
      expect(getPeersMap(service).size).toBe(0);
    });

    it('should emit disconnected event', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');
      service.disconnectFromParticipant('remote-001');

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'disconnected', participantId: 'remote-001' })
      );
    });

    it('should emit trackRemoved for associated remote tracks', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      const track = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });
      mockPc.simulateTrack(track, stream);

      onEvent.mockClear();
      service.disconnectFromParticipant('remote-001');

      const trackRemovedEvents = onEvent.mock.calls.filter(
        (args: unknown[]) => (args[0] as PeerConnectionEvent).type === 'trackRemoved'
      );
      expect(trackRemovedEvents.length).toBeGreaterThan(0);
    });

    it('should be a no-op for unknown participant', () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      service.disconnectFromParticipant('unknown-001');
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Multi-Participant (N>2)
  // ===========================================================================

  describe('multi-participant (N>2)', () => {
    it('should create independent PeerConnections for 3 participants', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');
      await service.connectToParticipant('remote-003');

      expect(getPeersMap(service).size).toBe(3);
    });

    it('should disconnect one without affecting others', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');
      await service.connectToParticipant('remote-003');

      service.disconnectFromParticipant('remote-002');

      expect(getPeersMap(service).size).toBe(2);
      expect(getPeersMap(service).has('remote-001')).toBe(true);
      expect(getPeersMap(service).has('remote-002')).toBe(false);
      expect(getPeersMap(service).has('remote-003')).toBe(true);
    });

    it('should add local tracks to each peer independently', async () => {
      const service = createService();
      service.start();

      const stream = new MockMediaStream({
        audioTracks: [{ kind: 'audio' }],
        videoTracks: [{ kind: 'video' }],
      });
      service.setLocalStream(stream);

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');

      for (const [, peer] of getPeersMap(service)) {
        const mockPc = getMockPC(peer);
        expect(mockPc.getSenders().length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // setLocalStream
  // ===========================================================================

  describe('setLocalStream', () => {
    it('should update tracks on all existing peers', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');

      const stream = new MockMediaStream({
        audioTracks: [{ kind: 'audio' }],
        videoTracks: [{ kind: 'video' }],
      });

      service.setLocalStream(stream);

      for (const [, peer] of getPeersMap(service)) {
        const mockPc = getMockPC(peer);
        expect(mockPc.getSenders().length).toBeGreaterThan(0);
      }
    });
  });

  // ===========================================================================
  // Connection State Events
  // ===========================================================================

  describe('connection state events', () => {
    it('should emit connected event on connection state change', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      mockPc.simulateConnectionStateChange('connected');

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'connected', participantId: 'remote-001' })
      );
    });

    it('should emit failed event on connection failure', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      mockPc.simulateConnectionStateChange('failed');

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'failed', participantId: 'remote-001' })
      );
    });
  });

  // ===========================================================================
  // getPeers / getRemoteTracks
  // ===========================================================================

  describe('getPeers', () => {
    it('should return peer info for all connected participants', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');

      const peers = service.getPeers();
      expect(peers).toHaveLength(2);
      expect(peers.map((p) => p.participantId).sort()).toEqual(['remote-001', 'remote-002']);
    });

    it('should include polite flag based on ID ordering', async () => {
      const service = createService({ localParticipantId: 'bbb' });
      service.start();

      await service.connectToParticipant('aaa');
      await service.connectToParticipant('ccc');

      const peers = service.getPeers();
      const peerA = peers.find((p) => p.participantId === 'aaa')!;
      const peerC = peers.find((p) => p.participantId === 'ccc')!;

      // bbb > aaa → polite with aaa
      expect(peerA.isPolite).toBe(true);
      // bbb < ccc → NOT polite with ccc
      expect(peerC.isPolite).toBe(false);
    });
  });
});
