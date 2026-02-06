/**
 * VideoGridContainer
 *
 * Bridges session participants and streams to the VideoGrid component.
 * Uses useDeferredValue for smoother updates during rapid participant changes.
 * Integrates speaker detection and network quality monitoring.
 */

import { useMemo, useDeferredValue, memo } from 'react';
import {
  VideoGrid,
  type VideoParticipant,
  useRemoteStreams,
  useScreenShare,
  useAudioLevels,
  useNetworkQuality,
} from '@/features/media';
import { useSessionStore } from '@/shared/stores/session.store';
import { useMediaStore } from '@/shared/stores/media.store';
import type { Participant } from '@protocol/index';
import type { NetworkQualityLevel } from '@/features/media';

/**
 * Build VideoParticipant from session participant and stream data
 */
function buildVideoParticipant(
  participant: Participant,
  isLocal: boolean,
  stream: MediaStream | null,
  isAudioEnabled: boolean,
  isVideoEnabled: boolean,
  isSpeaking: boolean,
  quality: NetworkQualityLevel
): VideoParticipant {
  return {
    participantId: participant.id,
    displayName: participant.displayName,
    stream,
    isLocal,
    isAudioEnabled,
    isVideoEnabled,
    isSpeaking,
    quality,
  };
}

export const VideoGridContainer = memo(function VideoGridContainer() {
  // Session state - subscribe directly to Maps for proper reactivity
  const localParticipantId = useSessionStore((s) => s.localParticipantId);
  const participantsMap = useSessionStore((s) => s.participants);

  // Convert Map to array for processing - this will be recalculated when Map changes
  const sessionParticipants = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap]
  );

  // Local media state
  const localStream = useMediaStore((s) => s.localStream);
  const isAudioEnabled = useMediaStore((s) => s.isAudioEnabled);
  const isVideoEnabled = useMediaStore((s) => s.isVideoEnabled);

  // Remote streams from WebRTC
  const { streams: remoteStreams, screenShareParticipantId } = useRemoteStreams();

  // Local screen share
  const { isScreenSharing, screenShareStream } = useScreenShare();

  // Speaker detection
  const { isSpeaking } = useAudioLevels({
    enabled: true,
    localParticipantId,
  });

  // Network quality monitoring
  const { getQuality } = useNetworkQuality({ enabled: true });

  // Build participants list with memoization
  const participants = useMemo((): VideoParticipant[] => {
    const result: VideoParticipant[] = [];

    for (const participant of sessionParticipants) {
      const isLocal = participant.id === localParticipantId;
      const speaking = isSpeaking(participant.id);
      const quality = isLocal ? 'good' : getQuality(participant.id);

      if (isLocal) {
        // Local participant - use local stream from media store
        result.push(
          buildVideoParticipant(
            participant,
            true,
            localStream,
            isAudioEnabled,
            isVideoEnabled,
            speaking,
            quality
          )
        );
      } else {
        // Remote participant - use stream from WebRTC store
        const remoteInfo = remoteStreams.get(participant.id);
        result.push(
          buildVideoParticipant(
            participant,
            false,
            remoteInfo?.mediaStream ?? null,
            participant.mediaState?.audioEnabled ?? false,
            participant.mediaState?.videoEnabled ?? false,
            speaking,
            quality
          )
        );
      }
    }

    return result;
  }, [
    sessionParticipants,
    localParticipantId,
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    remoteStreams,
    isSpeaking,
    getQuality,
  ]);

  // Use deferred value for smoother updates during rapid participant changes
  const deferredParticipants = useDeferredValue(participants);

  // Build screen share prop with memoization
  const screenShare = useMemo(() => {
    // Local screen share takes priority
    if (isScreenSharing && screenShareStream) {
      const localParticipant = sessionParticipants.find(
        (p) => p.id === localParticipantId
      );
      return {
        participantId: localParticipantId!,
        displayName: localParticipant?.displayName ?? 'You',
        stream: screenShareStream,
      };
    }

    // Remote screen share
    if (screenShareParticipantId) {
      const remoteInfo = remoteStreams.get(screenShareParticipantId);
      const participant = sessionParticipants.find(
        (p) => p.id === screenShareParticipantId
      );
      if (remoteInfo?.screenStream && participant) {
        return {
          participantId: screenShareParticipantId,
          displayName: participant.displayName,
          stream: remoteInfo.screenStream,
        };
      }
    }

    return null;
  }, [
    sessionParticipants,
    isScreenSharing,
    screenShareStream,
    screenShareParticipantId,
    remoteStreams,
    localParticipantId,
  ]);

  return (
    <VideoGrid
      participants={deferredParticipants}
      screenShare={screenShare}
      className="h-full"
      data-testid="video-grid-container"
    />
  );
});

VideoGridContainer.displayName = 'VideoGridContainer';
