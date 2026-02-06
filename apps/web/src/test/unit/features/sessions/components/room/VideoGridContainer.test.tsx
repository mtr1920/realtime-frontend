/**
 * VideoGridContainer Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoGridContainer } from '@/features/sessions/components/room/VideoGridContainer';

// Mock VideoGrid to track calls
const mockVideoGrid = vi.fn(
  ({
    participants,
    screenShare,
    'data-testid': testId,
  }: {
    participants: { participantId: string; displayName: string }[];
    screenShare?: { displayName: string } | null;
    'data-testid'?: string;
  }) => (
    <div data-testid={testId ?? 'mock-video-grid'}>
      {participants.map((p) => (
        <div key={p.participantId} data-testid={`participant-${p.participantId}`}>
          {p.displayName}
        </div>
      ))}
      {screenShare && (
        <div data-testid="screen-share">{screenShare.displayName}&apos;s screen</div>
      )}
    </div>
  )
);

// Mock stores
vi.mock('@/shared/stores/session.store', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('@/shared/stores/media.store', () => ({
  useMediaStore: vi.fn(),
}));

vi.mock('@/features/media', () => ({
  VideoGrid: (props: Parameters<typeof mockVideoGrid>[0]) => mockVideoGrid(props),
  useRemoteStreams: vi.fn(),
  useScreenShare: vi.fn(),
  useAudioLevels: vi.fn(),
  useNetworkQuality: vi.fn(),
}));

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [];
  }
  getAudioTracks() {
    return [];
  }
  getVideoTracks() {
    return [];
  }
}

(global as unknown as { MediaStream: typeof MockMediaStream }).MediaStream =
  MockMediaStream;

import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import { useRemoteStreams, useScreenShare, useAudioLevels, useNetworkQuality } from '@/features/media';

const mockUseSessionStore = vi.mocked(useSessionStore);
const mockUseMediaStore = vi.mocked(useMediaStore);
const mockUseRemoteStreams = vi.mocked(useRemoteStreams);
const mockUseScreenShare = vi.mocked(useScreenShare);
const mockUseAudioLevels = vi.mocked(useAudioLevels);
const mockUseNetworkQuality = vi.mocked(useNetworkQuality);

describe('VideoGridContainer', () => {
  const mockParticipants = [
    {
      id: 'local-1',
      displayName: 'Alice',
      mediaState: { audioEnabled: true, videoEnabled: true },
    },
    {
      id: 'remote-1',
      displayName: 'Bob',
      mediaState: { audioEnabled: true, videoEnabled: false },
    },
    {
      id: 'remote-2',
      displayName: 'Charlie',
      mediaState: { audioEnabled: false, videoEnabled: true },
    },
  ];

  beforeEach(() => {
    // Default mock implementations
    mockUseSessionStore.mockImplementation((selector) => {
      const participantsMap = new Map(mockParticipants.map(p => [p.id, p]));
      const state = {
        localParticipantId: 'local-1',
        participants: participantsMap,
        getParticipantsList: () => mockParticipants,
      };
      return selector(state as never);
    });

    mockUseMediaStore.mockImplementation((selector) => {
      const state = {
        localStream: new MockMediaStream() as unknown as MediaStream,
        isAudioEnabled: true,
        isVideoEnabled: true,
      };
      return selector(state as never);
    });

    mockUseRemoteStreams.mockReturnValue({
      streams: new Map([
        [
          'remote-1',
          {
            participantId: 'remote-1',
            mediaStream: new MockMediaStream() as unknown as MediaStream,
            screenStream: null,
            audioTrack: null,
            videoTrack: null,
            screenTrack: null,
          },
        ],
        [
          'remote-2',
          {
            participantId: 'remote-2',
            mediaStream: new MockMediaStream() as unknown as MediaStream,
            screenStream: null,
            audioTrack: null,
            videoTrack: null,
            screenTrack: null,
          },
        ],
      ]),
      getStream: vi.fn(),
      participantIds: ['remote-1', 'remote-2'],
      hasScreenShare: vi.fn(() => false),
      screenShareParticipantId: null,
    });

    mockUseScreenShare.mockReturnValue({
      isScreenSharing: false,
      screenShareStream: null,
      error: null,
      startScreenShare: vi.fn(),
      stopScreenShare: vi.fn(),
    });

    mockUseAudioLevels.mockReturnValue({
      speakingMap: new Map(),
      levelsMap: new Map(),
      isSpeaking: vi.fn(() => false),
      getLevel: vi.fn(() => 0),
    });

    mockUseNetworkQuality.mockReturnValue({
      overallQuality: 'good',
      allStats: [],
      getStats: vi.fn(),
      getQuality: vi.fn(() => 'good' as const),
      start: vi.fn(),
      stop: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render all session participants', () => {
    render(<VideoGridContainer />);

    expect(screen.getByTestId('participant-local-1')).toHaveTextContent('Alice');
    expect(screen.getByTestId('participant-remote-1')).toHaveTextContent('Bob');
    expect(screen.getByTestId('participant-remote-2')).toHaveTextContent(
      'Charlie'
    );
  });

  it('should mark local participant correctly', () => {
    render(<VideoGridContainer />);

    expect(mockVideoGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: expect.arrayContaining([
          expect.objectContaining({
            participantId: 'local-1',
            isLocal: true,
          }),
        ]),
      })
    );
  });

  it('should use local stream for local participant', () => {
    const mockLocalStream = new MockMediaStream();
    mockUseMediaStore.mockImplementation((selector) => {
      const state = {
        localStream: mockLocalStream as unknown as MediaStream,
        isAudioEnabled: true,
        isVideoEnabled: true,
      };
      return selector(state as never);
    });

    render(<VideoGridContainer />);

    expect(mockVideoGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: expect.arrayContaining([
          expect.objectContaining({
            participantId: 'local-1',
            stream: mockLocalStream,
          }),
        ]),
      })
    );
  });

  it('should use remote stream for remote participants', () => {
    render(<VideoGridContainer />);

    expect(mockVideoGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: expect.arrayContaining([
          expect.objectContaining({
            participantId: 'remote-1',
            isLocal: false,
          }),
        ]),
      })
    );
  });

  it('should show local screen share when sharing', () => {
    mockUseScreenShare.mockReturnValue({
      isScreenSharing: true,
      screenShareStream: new MockMediaStream() as unknown as MediaStream,
      error: null,
      startScreenShare: vi.fn(),
      stopScreenShare: vi.fn(),
    });

    render(<VideoGridContainer />);

    expect(screen.getByTestId('screen-share')).toHaveTextContent(
      "Alice's screen"
    );
  });

  it('should show remote screen share when another participant shares', () => {
    mockUseRemoteStreams.mockReturnValue({
      streams: new Map([
        [
          'remote-1',
          {
            participantId: 'remote-1',
            mediaStream: new MockMediaStream() as unknown as MediaStream,
            screenStream: new MockMediaStream() as unknown as MediaStream,
            audioTrack: null,
            videoTrack: null,
            screenTrack: {} as MediaStreamTrack,
          },
        ],
      ]),
      getStream: vi.fn(),
      participantIds: ['remote-1'],
      hasScreenShare: vi.fn(() => true),
      screenShareParticipantId: 'remote-1',
    });

    render(<VideoGridContainer />);

    expect(screen.getByTestId('screen-share')).toHaveTextContent("Bob's screen");
  });

  it('should handle empty participant list', () => {
    mockUseSessionStore.mockImplementation((selector) => {
      const state = {
        localParticipantId: null,
        participants: new Map(),
        getParticipantsList: () => [],
      };
      return selector(state as never);
    });

    render(<VideoGridContainer />);

    expect(mockVideoGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: [],
      })
    );
  });

  it('should handle participant without media state', () => {
    const participantsWithoutMedia = [{ id: 'remote-1', displayName: 'Bob' }]; // No mediaState
    mockUseSessionStore.mockImplementation((selector) => {
      const participantsMap = new Map(participantsWithoutMedia.map(p => [p.id, p]));
      const state = {
        localParticipantId: 'local-1',
        participants: participantsMap,
        getParticipantsList: () => participantsWithoutMedia,
      };
      return selector(state as never);
    });

    render(<VideoGridContainer />);

    expect(mockVideoGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: expect.arrayContaining([
          expect.objectContaining({
            participantId: 'remote-1',
            isAudioEnabled: false,
            isVideoEnabled: false,
          }),
        ]),
      })
    );
  });

  it('should have data-testid attribute', () => {
    render(<VideoGridContainer />);
    expect(screen.getByTestId('video-grid-container')).toBeInTheDocument();
  });
});
