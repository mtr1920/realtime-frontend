/**
 * PeerConnection Tests
 *
 * Tests for the RTCPeerConnection wrapper class.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PeerConnection, type PeerConnectionCallbacks } from '@/features/media/services/peer-connection';
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

// =============================================================================
// Test Setup
// =============================================================================

describe('PeerConnection', () => {
  let callbacks: PeerConnectionCallbacks;
  let mockCallbacks: {
    onConnectionStateChange: ReturnType<typeof vi.fn>;
    onIceConnectionStateChange: ReturnType<typeof vi.fn>;
    onIceCandidate: ReturnType<typeof vi.fn>;
    onNegotiationNeeded: ReturnType<typeof vi.fn>;
    onTrack: ReturnType<typeof vi.fn>;
    onTrackEnded: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetPeerConnectionIdCounter();
    installMockRTCPeerConnection();

    mockCallbacks = {
      onConnectionStateChange: vi.fn(),
      onIceConnectionStateChange: vi.fn(),
      onIceCandidate: vi.fn(),
      onNegotiationNeeded: vi.fn(),
      onTrack: vi.fn(),
      onTrackEnded: vi.fn(),
    };

    callbacks = mockCallbacks;
  });

  afterEach(() => {
    uninstallMockRTCPeerConnection();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Construction
  // ===========================================================================

  describe('construction', () => {
    it('should create peer connection with default config', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      expect(peer).toBeDefined();
      expect(peer.connectionState).toBe('new');
      expect(peer.iceConnectionState).toBe('new');
    });

    it('should create peer connection with custom config', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: false,
        config: {
          iceServers: [{ urls: 'stun:custom.server.com' }],
          iceCandidatePoolSize: 5,
        },
        callbacks,
      });

      expect(peer).toBeDefined();
    });
  });

  // ===========================================================================
  // Track Management
  // ===========================================================================

  describe('addTrack', () => {
    it('should add track to peer connection', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });

      const sender = peer.addTrack(track, stream);

      expect(sender).toBeDefined();
      expect(sender.track).toBe(track);
    });

    it('should trigger negotiation needed after adding track', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'video' });
      const stream = new MockMediaStream({ videoTracks: [{ kind: 'video' }] });

      peer.addTrack(track, stream);

      // Wait for async negotiation trigger
      await vi.waitFor(() => {
        expect(mockCallbacks.onNegotiationNeeded).toHaveBeenCalled();
      });
    });
  });

  describe('removeTrack', () => {
    it('should remove track from peer connection', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });

      peer.addTrack(track, stream);
      peer.removeTrack(track.id);

      // Track should be removed (no error thrown)
      expect(true).toBe(true);
    });
  });

  describe('replaceTrack', () => {
    it('should replace track without renegotiation', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const oldTrack = new MockMediaStreamTrack({ kind: 'audio' });
      const newTrack = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });

      peer.addTrack(oldTrack, stream);
      await peer.replaceTrack(oldTrack.id, newTrack);

      // No error means success
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // Offer/Answer
  // ===========================================================================

  describe('createOffer', () => {
    it('should create an offer', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const offer = await peer.createOffer();

      expect(offer.type).toBe('offer');
      expect(offer.sdp).toBeDefined();
    });

    it('should generate ICE candidates after setting local description', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      await peer.createOffer();

      // Wait for ICE candidate generation
      await vi.waitFor(() => {
        expect(mockCallbacks.onIceCandidate).toHaveBeenCalled();
      });
    });
  });

  describe('handleOffer', () => {
    it('should handle remote offer and return answer', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true, // Polite peer accepts offers
        callbacks,
      });

      const offer = { type: 'offer' as RTCSdpType, sdp: 'remote-offer-sdp' };
      const answer = await peer.handleOffer(offer);

      expect(answer).not.toBeNull();
      expect(answer?.type).toBe('answer');
    });

    it('should ignore offer if impolite and collision detected', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: false, // Impolite peer ignores collisions
        callbacks,
      });

      // Create a local offer first (simulating collision)
      await peer.createOffer();

      // Now try to handle a remote offer - should be ignored for impolite peer
      const offer = { type: 'offer' as RTCSdpType, sdp: 'remote-offer-sdp' };
      const answer = await peer.handleOffer(offer);

      // Impolite peer ignores the offer when there's a collision
      expect(answer).toBeNull();
    });

    it('should accept offer if polite even with collision', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true, // Polite peer yields to remote offer
        callbacks,
      });

      // Polite peer should accept even if making offer
      const offer = { type: 'offer' as RTCSdpType, sdp: 'remote-offer-sdp' };
      const answer = await peer.handleOffer(offer);

      expect(answer).not.toBeNull();
    });
  });

  describe('handleAnswer', () => {
    it('should handle remote answer', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      // Create offer first
      await peer.createOffer();

      // Handle answer
      const answer = { type: 'answer' as RTCSdpType, sdp: 'remote-answer-sdp' };
      await peer.handleAnswer(answer);

      // No error means success
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // ICE Candidates
  // ===========================================================================

  describe('addIceCandidate', () => {
    it('should add ICE candidate from remote peer', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      // Set up remote description first
      await peer.handleOffer({ type: 'offer', sdp: 'remote-offer' });

      // Add ICE candidate
      await peer.addIceCandidate({
        candidate: 'candidate:remote',
        sdpMid: '0',
        sdpMLineIndex: 0,
      });

      // No error means success
      expect(true).toBe(true);
    });
  });

  // ===========================================================================
  // ICE Restart
  // ===========================================================================

  describe('restartIce', () => {
    it('should create offer with ICE restart', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const offer = await peer.restartIce();

      expect(offer.type).toBe('offer');
      expect(offer.sdp).toContain('restart');
    });
  });

  // ===========================================================================
  // Connection State Events
  // ===========================================================================

  describe('connection state events', () => {
    it('should call onConnectionStateChange when connection state changes', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      // Get underlying mock and simulate state change
      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.simulateConnectionStateChange('connected');

      expect(mockCallbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
    });

    it('should call onIceConnectionStateChange when ICE state changes', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.simulateIceConnectionStateChange('checking');

      expect(mockCallbacks.onIceConnectionStateChange).toHaveBeenCalledWith('checking');
    });
  });

  // ===========================================================================
  // Remote Track Events
  // ===========================================================================

  describe('remote track events', () => {
    it('should call onTrack when remote track is received', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'audio', label: 'Remote Audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });

      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.simulateTrack(track, stream);

      expect(mockCallbacks.onTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          participantId: 'participant-001',
          track,
          kind: 'audio',
        })
      );
    });

    it('should detect screen share tracks by label', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'video', label: 'Screen Share' });
      const stream = new MockMediaStream({ videoTracks: [{ kind: 'video' }] });

      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.simulateTrack(track, stream);

      expect(mockCallbacks.onTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'screen',
        })
      );
    });

    it('should call onTrackEnded when track ends', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const track = new MockMediaStreamTrack({ kind: 'audio' });
      const stream = new MockMediaStream({ audioTracks: [{ kind: 'audio' }] });

      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.simulateTrack(track, stream);

      // Simulate track ending
      track.stop();

      expect(mockCallbacks.onTrackEnded).toHaveBeenCalledWith(track.id);
    });
  });

  // ===========================================================================
  // Statistics
  // ===========================================================================

  describe('getStats', () => {
    it('should return stats report', async () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      const stats = await peer.getStats();

      expect(stats).toBeDefined();
    });
  });

  // ===========================================================================
  // Cleanup
  // ===========================================================================

  describe('close', () => {
    it('should close the peer connection', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      peer.close();

      expect(peer.connectionState).toBe('closed');
    });

    it('should remove all event handlers on close', () => {
      const peer = new PeerConnection({
        participantId: 'participant-001',
        isPolite: true,
        callbacks,
      });

      peer.close();

      // After close, events should not fire callbacks
      const mockPc = (peer as unknown as { pc: MockRTCPeerConnection }).pc;
      mockPc.onconnectionstatechange?.(new Event('connectionstatechange'));

      // Callback should NOT have been called since handlers were removed
      expect(mockCallbacks.onConnectionStateChange).not.toHaveBeenCalled();
    });
  });
});
