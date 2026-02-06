/**
 * VideoGrid Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoGrid, type VideoParticipant } from '@/features/media/components/VideoGrid/VideoGrid';

// Mock MediaStream globally for tests
class MockMediaStream {
  private tracks: MediaStreamTrack[] = [];

  constructor() {
    this.tracks = [];
  }

  getTracks(): MediaStreamTrack[] {
    return this.tracks;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === 'audio');
  }

  getVideoTracks(): MediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === 'video');
  }

  addTrack(track: MediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MediaStreamTrack): void {
    this.tracks = this.tracks.filter((t) => t !== track);
  }
}

(global as unknown as { MediaStream: typeof MockMediaStream }).MediaStream = MockMediaStream;

// Helper to create mock MediaStream
function createMockMediaStream(): MediaStream {
  return new MockMediaStream() as unknown as MediaStream;
}

// Helper to create mock participant
function createMockParticipant(overrides: Partial<VideoParticipant> = {}): VideoParticipant {
  return {
    participantId: `participant-${Math.random().toString(36).substr(2, 9)}`,
    displayName: 'Test User',
    stream: createMockMediaStream(),
    isLocal: false,
    isAudioEnabled: true,
    isVideoEnabled: true,
    isSpeaking: false,
    audioLevel: 0,
    quality: 'good',
    ...overrides,
  };
}

describe('VideoGrid', () => {
  describe('empty state', () => {
    it('should render empty grid when no participants', () => {
      render(<VideoGrid participants={[]} />);

      // Grid should exist but have no video tiles
      const tiles = screen.queryAllByRole('region');
      expect(tiles).toHaveLength(0);
    });
  });

  describe('single participant', () => {
    it('should render single participant in 1x1 layout', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      render(<VideoGrid participants={[participant]} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  describe('grid layout calculations', () => {
    it('should render 2 participants in 2-column layout', () => {
      const participants = [
        createMockParticipant({ participantId: 'p1', displayName: 'Alice' }),
        createMockParticipant({ participantId: 'p2', displayName: 'Bob' }),
      ];

      const { container } = render(<VideoGrid participants={participants} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Check grid class
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should render 4 participants in 2x2 grid', () => {
      const participants = [
        createMockParticipant({ participantId: 'p1', displayName: 'Alice' }),
        createMockParticipant({ participantId: 'p2', displayName: 'Bob' }),
        createMockParticipant({ participantId: 'p3', displayName: 'Charlie' }),
        createMockParticipant({ participantId: 'p4', displayName: 'Diana' }),
      ];

      const { container } = render(<VideoGrid participants={participants} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText('Diana')).toBeInTheDocument();

      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should render 6 participants in 3x2 grid', () => {
      const participants = Array.from({ length: 6 }, (_, i) =>
        createMockParticipant({ participantId: `p${i}`, displayName: `User ${i + 1}` })
      );

      const { container } = render(<VideoGrid participants={participants} />);

      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should render 9 participants in 3x3 grid', () => {
      const participants = Array.from({ length: 9 }, (_, i) =>
        createMockParticipant({ participantId: `p${i}`, displayName: `User ${i + 1}` })
      );

      const { container } = render(<VideoGrid participants={participants} />);

      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should render 10+ participants in 4-column grid with scroll', () => {
      const participants = Array.from({ length: 12 }, (_, i) =>
        createMockParticipant({ participantId: `p${i}`, displayName: `User ${i + 1}` })
      );

      const { container } = render(<VideoGrid participants={participants} />);

      const grid = container.querySelector('.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('local participant', () => {
    it('should mark local participant with mirrored video', () => {
      const localParticipant = createMockParticipant({
        participantId: 'local',
        displayName: 'You',
        isLocal: true,
      });

      const { container } = render(<VideoGrid participants={[localParticipant]} />);

      // Local video should have mirror class
      const video = container.querySelector('video');
      expect(video).toHaveClass('scale-x-[-1]');
    });

    it('should show (You) suffix for local participant', () => {
      const localParticipant = createMockParticipant({
        participantId: 'local',
        displayName: 'Alice',
        isLocal: true,
      });

      render(<VideoGrid participants={[localParticipant]} />);

      // Name and "You" badge are shown as separate elements
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('screen share mode', () => {
    it('should render screen share in priority layout', () => {
      const participants = [
        createMockParticipant({ participantId: 'p1', displayName: 'Alice' }),
        createMockParticipant({ participantId: 'p2', displayName: 'Bob' }),
      ];

      const screenShare = {
        participantId: 'p1',
        displayName: 'Alice',
        stream: createMockMediaStream(),
      };

      render(<VideoGrid participants={participants} screenShare={screenShare} />);

      // Should show screen share label
      expect(screen.getByText("Alice's screen")).toBeInTheDocument();
    });

    it('should show participant thumbnails below screen share', () => {
      const participants = [
        createMockParticipant({ participantId: 'p1', displayName: 'Alice' }),
        createMockParticipant({ participantId: 'p2', displayName: 'Bob' }),
      ];

      const screenShare = {
        participantId: 'p1',
        displayName: 'Alice',
        stream: createMockMediaStream(),
      };

      render(<VideoGrid participants={participants} screenShare={screenShare} />);

      // Both participant names should be visible as thumbnails
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('gap prop', () => {
    it('should apply gap-1 class when gap is 1', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      const { container } = render(<VideoGrid participants={[participant]} gap={1} />);

      expect(container.querySelector('.gap-1')).toBeInTheDocument();
    });

    it('should apply gap-2 class by default', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      expect(container.querySelector('.gap-2')).toBeInTheDocument();
    });

    it('should apply gap-4 class when gap is 4', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      const { container } = render(<VideoGrid participants={[participant]} gap={4} />);

      expect(container.querySelector('.gap-4')).toBeInTheDocument();
    });
  });

  describe('participant state display', () => {
    it('should show muted icon when audio is disabled', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isAudioEnabled: false,
      });

      render(<VideoGrid participants={[participant]} />);

      expect(screen.getByText('Microphone muted')).toBeInTheDocument();
    });

    it('should show microphone icon when audio is enabled', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isAudioEnabled: true,
      });

      render(<VideoGrid participants={[participant]} />);

      expect(screen.getByText('Microphone on')).toBeInTheDocument();
    });

    it('should show placeholder when video is disabled', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isVideoEnabled: false,
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      // Video should be hidden
      const video = container.querySelector('video');
      expect(video).toHaveClass('hidden');
    });

    it('should show screen sharing view when screenShare prop provided', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      const screenShare = {
        participantId: 'p1',
        displayName: 'Alice',
        stream: new MediaStream(),
      };

      render(<VideoGrid participants={[participant]} screenShare={screenShare} />);

      // Grid should have screen share layout
      expect(screen.getByText("Alice's screen")).toBeInTheDocument();
    });
  });

  describe('connection quality', () => {
    it('should show quality badge for good quality', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        quality: 'good',
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      // QualityIndicator uses aria-label "Good connection"
      const badge = container.querySelector('[title="Good connection"]');
      expect(badge).toBeInTheDocument();
    });

    it('should show quality badge for poor quality', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        quality: 'poor',
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      // QualityIndicator uses aria-label "Poor connection"
      const badge = container.querySelector('[title="Poor connection"]');
      expect(badge).toBeInTheDocument();
    });

    it('should not show quality badge for unknown quality', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        quality: 'unknown',
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      const badge = container.querySelector('[title^="Connection:"]');
      expect(badge).toBeNull();
    });
  });

  describe('speaking indicator', () => {
    it('should highlight speaking participant with ring', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isSpeaking: true,
        isLocal: false,
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      const tile = container.querySelector('[data-participant-id="p1"]');
      // Uses speaking-ring CSS utility class for the green ring effect
      expect(tile).toHaveClass('speaking-ring');
    });

    it('should not highlight speaking local participant', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isSpeaking: true,
        isLocal: true,
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      const tile = container.querySelector('[data-participant-id="p1"]');
      expect(tile).not.toHaveClass('speaking-ring');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to container element', () => {
      const ref = vi.fn();
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      render(<VideoGrid ref={ref} participants={[participant]} />);

      expect(ref).toHaveBeenCalled();
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
      });

      const { container } = render(
        <VideoGrid participants={[participant]} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have accessible labels for audio state', () => {
      const mutedParticipant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        isAudioEnabled: false,
      });

      render(<VideoGrid participants={[mutedParticipant]} />);

      // Screen reader text should be present
      expect(screen.getByText('Microphone muted')).toBeInTheDocument();
    });

    it('should have participant id as data attribute', () => {
      const participant = createMockParticipant({
        participantId: 'test-id',
        displayName: 'Alice',
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      const tile = container.querySelector('[data-participant-id="test-id"]');
      expect(tile).toBeInTheDocument();
    });
  });

  describe('video stream handling', () => {
    it('should handle null stream gracefully', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        stream: null,
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      // Should show placeholder
      const video = container.querySelector('video');
      expect(video).toHaveClass('hidden');
    });

    it('should display video when stream is available', () => {
      const participant = createMockParticipant({
        participantId: 'p1',
        displayName: 'Alice',
        stream: createMockMediaStream(),
        isVideoEnabled: true,
      });

      const { container } = render(<VideoGrid participants={[participant]} />);

      const video = container.querySelector('video');
      expect(video).not.toHaveClass('hidden');
    });
  });
});
