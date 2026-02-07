/**
 * WebRTCService Tests — Signaling & Negotiation
 *
 * Tests for handleRemoteOffer, handleNegotiationNeeded (per-peer flag),
 * observer mode, participant departure, and shutdown cleanup.
 *
 * See webrtc.service.test.ts for core connection tests.
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
  destroyWebRTCService,
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

function getProcessingSet(service: WebRTCService): Set<string> {
  return (service as unknown as { processingRemoteOfferFrom: Set<string> })
    .processingRemoteOfferFrom;
}

function getPeersWithTracksAddedSet(service: WebRTCService): Set<string> {
  return (service as unknown as { peersWithTracksAdded: Set<string> })
    .peersWithTracksAdded;
}

function getMockPC(peer: unknown): MockRTCPeerConnection {
  return (peer as unknown as { pc: MockRTCPeerConnection }).pc;
}

function getHandleRemoteOffer(
  service: WebRTCService
): (from: string, sdp: string, kind: string) => Promise<void> {
  return (
    service as unknown as {
      handleRemoteOffer: (from: string, sdp: string, kind: string) => Promise<void>;
    }
  ).handleRemoteOffer.bind(service);
}

// =============================================================================
// Tests
// =============================================================================

describe('WebRTCService — Signaling', () => {
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
  // handleRemoteOffer
  // ===========================================================================

  describe('handleRemoteOffer', () => {
    it('should create peer for unknown participant on incoming offer', async () => {
      const service = createService();
      service.start();

      await getHandleRemoteOffer(service)('remote-001', 'remote-offer-sdp', 'media');

      expect(getPeersMap(service).size).toBe(1);
      expect(getPeersMap(service).has('remote-001')).toBe(true);
    });

    it('should handle offer from already-connected participant', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await getHandleRemoteOffer(service)('remote-001', 'remote-reoffer-sdp', 'media');

      expect(getPeersMap(service).size).toBe(1);
    });

    it('should recreate failed peer connection on incoming offer', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      mockPc.simulateConnectionStateChange('failed');

      await getHandleRemoteOffer(service)('remote-001', 'remote-offer-sdp', 'media');

      expect(getPeersMap(service).size).toBe(1);
    });

    it('should add per-peer offer flag and clean it up after processing', async () => {
      const service = createService();
      service.start();

      const processingSet = getProcessingSet(service);
      await getHandleRemoteOffer(service)('remote-001', 'remote-offer-sdp', 'media');

      expect(processingSet.has('remote-001')).toBe(false);
    });

    it('should emit failed event on error', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      mockPc.setRemoteDescription = vi.fn().mockRejectedValue(new Error('SDP error'));

      await getHandleRemoteOffer(service)('remote-001', 'bad-sdp', 'media');

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failed',
          participantId: 'remote-001',
        })
      );
    });
  });

  // ===========================================================================
  // handleNegotiationNeeded (per-peer flag)
  // ===========================================================================

  describe('handleNegotiationNeeded', () => {
    it('should suppress for observer', async () => {
      const service = createService({ isObserver: true });
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);

      mockPc.localDescription = null;
      const signalingBefore = mockPc.signalingState;

      mockPc.simulateNegotiationNeeded();

      await vi.waitFor(() => {
        expect(mockPc.signalingState).toBe(signalingBefore);
      });
    });

    it('should suppress when processing offer from SAME peer', async () => {
      const service = createService({ localParticipantId: 'aaa-local' });
      service.start();

      await service.connectToParticipant('zzz-remote');

      const processingSet = getProcessingSet(service);
      processingSet.add('zzz-remote');

      const peer = getPeersMap(service).get('zzz-remote');
      const mockPc = getMockPC(peer);
      const descBefore = mockPc.localDescription;

      mockPc.simulateNegotiationNeeded();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPc.localDescription).toBe(descBefore);
      processingSet.delete('zzz-remote');
    });

    it('should NOT suppress when processing offer from DIFFERENT peer', async () => {
      const service = createService({ localParticipantId: 'aaa-local' });
      service.start();

      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });
      service.setLocalStream(stream);

      await service.connectToParticipant('zzz-remote-A');
      await service.connectToParticipant('zzz-remote-B');

      const processingSet = getProcessingSet(service);
      processingSet.add('zzz-remote-A');

      const peerB = getPeersMap(service).get('zzz-remote-B');
      const mockPcB = getMockPC(peerB);

      mockPcB.simulateNegotiationNeeded();

      await vi.waitFor(() => {
        expect(mockPcB.localDescription).not.toBeNull();
      });

      processingSet.delete('zzz-remote-A');
    });

    it('should only fire for initiator (lower ID by localeCompare)', async () => {
      // local = 'bbb', remote = 'aaa' → local > remote → local is polite → NOT initiator
      const service = createService({ localParticipantId: 'bbb-local' });
      service.start();

      await service.connectToParticipant('aaa-remote');

      const peer = getPeersMap(service).get('aaa-remote');
      const mockPc = getMockPC(peer);
      const descAfterConnect = mockPc.localDescription;

      mockPc.simulateNegotiationNeeded();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPc.localDescription).toBe(descAfterConnect);
    });
  });

  // ===========================================================================
  // Observer Mode (signaling behavior)
  // ===========================================================================

  describe('observer mode', () => {
    it('should not send local stream', () => {
      const service = createService({ isObserver: true });
      service.start();

      const stream = new MockMediaStream({
        audioTracks: [{ kind: 'audio' }],
        videoTracks: [{ kind: 'video' }],
      });

      service.setLocalStream(stream);
      expect(getPeersMap(service).size).toBe(0);
    });

    it('should not send screen share stream', () => {
      const service = createService({ isObserver: true });
      service.start();

      const stream = new MockMediaStream({
        videoTracks: [{ kind: 'video', label: 'Screen Share' }],
      });

      service.setScreenShareStream(stream);
      expect(getPeersMap(service).size).toBe(0);
    });

    it('should receive remote tracks from offers', async () => {
      const onEvent = vi.fn();
      const service = createService({ isObserver: true, onEvent });
      service.start();

      await getHandleRemoteOffer(service)('remote-001', 'remote-offer-sdp', 'media');

      expect(getPeersMap(service).size).toBe(1);

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      const track = new MockMediaStreamTrack({ kind: 'video' });
      const stream = new MockMediaStream({ videoTracks: [{ kind: 'video' }] });
      mockPc.simulateTrack(track, stream);

      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trackAdded',
          participantId: 'remote-001',
        })
      );
    });
  });

  // ===========================================================================
  // Participant Left (via signaling)
  // ===========================================================================

  describe('handleParticipantLeft', () => {
    it('should disconnect participant on left event', async () => {
      const onEvent = vi.fn();
      const service = createService({ onEvent });
      service.start();

      await service.connectToParticipant('remote-001');
      expect(getPeersMap(service).size).toBe(1);

      const handleParticipantLeft = (
        service as unknown as {
          handleParticipantLeft: (participantId: string) => void;
        }
      ).handleParticipantLeft.bind(service);

      handleParticipantLeft('remote-001');

      expect(getPeersMap(service).size).toBe(0);
      expect(onEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'disconnected', participantId: 'remote-001' })
      );
    });
  });

  // ===========================================================================
  // Shutdown & Cleanup
  // ===========================================================================

  describe('shutdown', () => {
    it('should close all peers on stop()', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');

      service.stop();
      expect(getPeersMap(service).size).toBe(0);
    });

    it('should clear processingRemoteOfferFrom set on closeAllPeers', async () => {
      const service = createService();
      service.start();

      const processingSet = getProcessingSet(service);
      processingSet.add('remote-001');
      processingSet.add('remote-002');

      service.stop();
      expect(processingSet.size).toBe(0);
    });

    it('should clear peersWithTracksAdded set on closeAllPeers', async () => {
      const service = createService();
      service.start();

      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });
      service.setLocalStream(stream);

      await service.connectToParticipant('remote-001');
      await service.connectToParticipant('remote-002');

      const tracksAddedSet = getPeersWithTracksAddedSet(service);
      expect(tracksAddedSet.size).toBe(2);

      service.stop();
      expect(tracksAddedSet.size).toBe(0);
    });

    it('should clear remote tracks on stop()', async () => {
      const service = createService();
      service.start();

      await service.connectToParticipant('remote-001');

      const peer = getPeersMap(service).get('remote-001');
      const mockPc = getMockPC(peer);
      const track = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });
      mockPc.simulateTrack(track, stream);

      const remoteTracks = service.getRemoteTracks();
      expect(remoteTracks.length).toBeGreaterThan(0);

      service.stop();
      expect(service.getRemoteTracks().length).toBe(0);
    });
  });
});
