/**
 * useRemoteStreams Hook
 *
 * Provides access to remote participant streams:
 * - Audio/video/screen tracks per participant
 * - Combined MediaStreams for rendering
 */

import { useMemo } from 'react';
import { useWebRTCStore } from '../stores/webrtc.store';
import type { RemoteTrack, TrackKind } from '../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

export interface RemoteStreamInfo {
  participantId: string;
  audioTrack: MediaStreamTrack | null;
  videoTrack: MediaStreamTrack | null;
  screenTrack: MediaStreamTrack | null;
  /** Combined stream with audio and video tracks */
  mediaStream: MediaStream | null;
  /** Separate stream for screen share */
  screenStream: MediaStream | null;
}

interface UseRemoteStreamsReturn {
  /** All remote streams indexed by participant ID */
  streams: Map<string, RemoteStreamInfo>;
  /** Get stream info for a specific participant */
  getStream: (participantId: string) => RemoteStreamInfo | undefined;
  /** Get all participant IDs with active streams */
  participantIds: string[];
  /** Check if a participant has a screen share active */
  hasScreenShare: (participantId: string) => boolean;
  /** Get the participant ID that's currently screen sharing (if any) */
  screenShareParticipantId: string | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useRemoteStreams(): UseRemoteStreamsReturn {
  // Subscribe directly to the remoteTracks Map for proper reactivity
  // Using a function selector that returns the Map triggers re-renders when it changes
  const remoteTracksMap = useWebRTCStore((s) => s.remoteTracks);

  // Convert Map to array for processing - this will be recalculated when Map changes
  const remoteTracks = useMemo(
    () => Array.from(remoteTracksMap.values()),
    [remoteTracksMap]
  );

  // Build stream info map
  const streams = useMemo(() => {
    const streamMap = new Map<string, RemoteStreamInfo>();

    // Group tracks by participant
    const tracksByParticipant = new Map<string, RemoteTrack[]>();
    for (const track of remoteTracks) {
      const existing = tracksByParticipant.get(track.participantId) ?? [];
      existing.push(track);
      tracksByParticipant.set(track.participantId, existing);
    }

    // Build stream info for each participant
    for (const [participantId, tracks] of tracksByParticipant) {
      let audioTrack: MediaStreamTrack | null = null;
      let videoTrack: MediaStreamTrack | null = null;
      let screenTrack: MediaStreamTrack | null = null;

      for (const track of tracks) {
        if (track.kind === 'audio') {
          audioTrack = track.track;
        } else if (track.kind === 'video') {
          videoTrack = track.track;
        } else if (track.kind === 'screen') {
          screenTrack = track.track;
        }
      }

      // Create combined media stream
      let mediaStream: MediaStream | null = null;
      if (audioTrack || videoTrack) {
        const streamTracks: MediaStreamTrack[] = [];
        if (audioTrack) streamTracks.push(audioTrack);
        if (videoTrack) streamTracks.push(videoTrack);
        mediaStream = new MediaStream(streamTracks);
      }

      // Create separate screen stream
      let screenStream: MediaStream | null = null;
      if (screenTrack) {
        screenStream = new MediaStream([screenTrack]);
      }

      streamMap.set(participantId, {
        participantId,
        audioTrack,
        videoTrack,
        screenTrack,
        mediaStream,
        screenStream,
      });
    }

    return streamMap;
  }, [remoteTracks]);

  // Get stream for specific participant
  const getStream = useMemo(
    () => (participantId: string) => streams.get(participantId),
    [streams]
  );

  // Get all participant IDs
  const participantIds = useMemo(
    () => Array.from(streams.keys()),
    [streams]
  );

  // Check if participant has screen share
  const hasScreenShare = useMemo(
    () => (participantId: string) => {
      const stream = streams.get(participantId);
      return stream?.screenTrack !== null;
    },
    [streams]
  );

  // Get the screen sharing participant
  const screenShareParticipantId = useMemo(() => {
    for (const [participantId, info] of streams) {
      if (info.screenTrack) {
        return participantId;
      }
    }
    return null;
  }, [streams]);

  return {
    streams,
    getStream,
    participantIds,
    hasScreenShare,
    screenShareParticipantId,
  };
}

// =============================================================================
// Utility Hook: Single Participant Stream
// =============================================================================

interface UseParticipantStreamOptions {
  participantId: string;
  kind?: TrackKind;
}

/**
 * Get stream for a single participant
 */
export function useParticipantStream({
  participantId,
  kind,
}: UseParticipantStreamOptions) {
  const getRemoteTracksForParticipant = useWebRTCStore(
    (s) => s.getRemoteTracksForParticipant
  );
  const tracks = getRemoteTracksForParticipant(participantId);

  return useMemo(() => {
    if (kind) {
      const track = tracks.find((t) => t.kind === kind);
      return track ? new MediaStream([track.track]) : null;
    }

    // Return combined stream
    const streamTracks = tracks
      .filter((t) => t.kind !== 'screen')
      .map((t) => t.track);

    return streamTracks.length > 0 ? new MediaStream(streamTracks) : null;
  }, [tracks, kind]);
}
