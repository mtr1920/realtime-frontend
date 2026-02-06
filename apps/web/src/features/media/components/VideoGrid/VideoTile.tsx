/**
 * VideoTile Component
 *
 * Individual participant video tile with polished UI:
 * - Video stream rendering
 * - Active speaker glow animation
 * - 4-bar quality indicator
 * - "You" badge for local participant
 * - Hover actions (pin, fullscreen)
 */

import { useRef, useEffect, forwardRef, memo, useState } from 'react';
import { Loader2, Mic, MicOff, MonitorUp } from 'lucide-react';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { VideoPlaceholder } from './VideoPlaceholder';
import { QualityIndicator } from './QualityIndicator';
import { VideoTileActions } from './VideoTileActions';
import type { NetworkQualityLevel } from '../../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

interface VideoTileProps {
  /** Participant ID */
  participantId: string;
  /** Display name */
  displayName: string;
  /** Video stream to display */
  stream: MediaStream | null;
  /** Whether this is the local participant */
  isLocal?: boolean;
  /** Whether audio is enabled */
  isAudioEnabled?: boolean;
  /** Whether video is enabled */
  isVideoEnabled?: boolean;
  /** Whether screen share is active */
  isScreenSharing?: boolean;
  /** Whether participant is speaking */
  isSpeaking?: boolean;
  /** Audio level (0-1) for visualization */
  audioLevel?: number;
  /** Connection quality */
  quality?: NetworkQualityLevel;
  /** Participant connection state (for reconnecting overlay) */
  connectionState?: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  /** Additional class name */
  className?: string;
  /** Whether to mirror the video (for local view) */
  mirrored?: boolean;
  /** Whether the tile is highlighted (e.g., pinned) */
  highlighted?: boolean;
  /** Called when pin is toggled */
  onPin?: (participantId: string) => void;
  /** Called when fullscreen is requested */
  onFullscreen?: (participantId: string) => void;
  /** Called when mute is requested (facilitator only) */
  onMute?: (participantId: string) => void;
  /** Whether to show mute action (facilitator permission) */
  showMuteAction?: boolean;
  /** Whether this tile is currently pinned */
  isPinned?: boolean;
}

// =============================================================================
// Audio Level Indicator (Enhanced)
// =============================================================================

function AudioLevelIndicator({ level, isSpeaking }: { level: number; isSpeaking: boolean }) {
  // Scale level to visual height (0-100%)
  const height = Math.min(100, Math.round(level * 100));

  return (
    <div
      className={cn(
        'absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full bg-black/30 overflow-hidden',
        'transition-opacity duration-200',
        !isSpeaking && 'opacity-40'
      )}
    >
      <div
        className={cn(
          'absolute bottom-0 w-full rounded-full transition-[height] duration-75',
          isSpeaking ? 'bg-green-400' : 'bg-green-500/70'
        )}
        style={{ height: `${height}%` }}
      />
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export const VideoTile = memo(
  forwardRef<HTMLDivElement, VideoTileProps>(
    (
      {
        participantId,
        displayName,
        stream,
        isLocal = false,
        isAudioEnabled = true,
        isVideoEnabled = true,
        isScreenSharing = false,
        isSpeaking = false,
        audioLevel = 0,
        quality = 'unknown',
        connectionState,
        className,
        mirrored = false,
        highlighted = false,
        onPin,
        onFullscreen,
        onMute,
        showMuteAction = false,
        isPinned = false,
      },
      ref
    ) => {
      const videoRef = useRef<HTMLVideoElement>(null);
      const [isHovered, setIsHovered] = useState(false);
      const [isTrackMuted, setIsTrackMuted] = useState(false);
      const [isTrackEnded, setIsTrackEnded] = useState(false);

      // Get current video track ID for effect dependency
      const videoTrack = stream?.getVideoTracks()[0];
      const videoTrackId = videoTrack?.id;

      // Attach stream to video element and listen for track events
      useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (stream) {
          video.srcObject = stream;

          const currentVideoTrack = stream.getVideoTracks()[0];
          if (currentVideoTrack) {
            // Set initial state from track
            setIsTrackMuted(currentVideoTrack.muted);
            setIsTrackEnded(currentVideoTrack.readyState === 'ended');

            const handleMute = () => setIsTrackMuted(true);
            const handleUnmute = () => setIsTrackMuted(false);
            const handleEnded = () => setIsTrackEnded(true);

            currentVideoTrack.addEventListener('mute', handleMute);
            currentVideoTrack.addEventListener('unmute', handleUnmute);
            currentVideoTrack.addEventListener('ended', handleEnded);

            return () => {
              currentVideoTrack.removeEventListener('mute', handleMute);
              currentVideoTrack.removeEventListener('unmute', handleUnmute);
              currentVideoTrack.removeEventListener('ended', handleEnded);
              video.srcObject = null;
            };
          }
        } else {
          video.srcObject = null;
          setIsTrackMuted(false);
          setIsTrackEnded(false);
        }

        return () => {
          video.srcObject = null;
        };
      }, [stream, videoTrackId]); // Key: videoTrackId detects track replacement

      // Determine what to show - include track state
      const showVideo = stream && isVideoEnabled && !isTrackMuted && !isTrackEnded;
      const initials = displayName.charAt(0).toUpperCase();
      const hasActions = onPin || onFullscreen || (showMuteAction && onMute);

      return (
        <div
          ref={ref}
          data-participant-id={participantId}
          className={cn(
            'hover-reveal-container',
            'relative aspect-video overflow-hidden rounded-xl bg-muted',
            'transition-all duration-200',
            // Highlighted/Pinned state
            highlighted && 'ring-2 ring-primary shadow-lg',
            // Speaking glow effect (not for local, not when highlighted)
            isSpeaking && !isLocal && !highlighted && 'motion-safe:animate-speaking-glow speaking-ring',
            // Hover lift
            'hover:shadow-lg',
            className
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              mirrored && 'scale-x-[-1]',
              !showVideo && 'hidden'
            )}
          />

          {/* Placeholder when video is off */}
          {!showVideo && (
            <VideoPlaceholder
              reason={!isVideoEnabled ? 'camera-off' : (stream ? 'camera-off' : 'loading')}
              displayName={displayName}
              initials={initials}
            />
          )}

          {/* Reconnecting overlay */}
          {connectionState === 'reconnecting' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Loader2
                className="h-8 w-8 text-white motion-safe:animate-spin"
                aria-hidden="true"
              />
              <span className="mt-2 text-sm font-medium text-white/90">
                Reconnecting...
              </span>
            </div>
          )}

          {/* Audio level indicator */}
          {!isLocal && isSpeaking && showVideo && (
            <AudioLevelIndicator level={audioLevel} isSpeaking={isSpeaking} />
          )}

          {/* "You" badge for local participant */}
          {isLocal && (
            <Badge
              variant="secondary"
              className={cn(
                'absolute top-2 left-2 text-xs font-medium',
                'bg-black/50 text-white border-0 backdrop-blur-sm'
              )}
            >
              You
            </Badge>
          )}

          {/* Hover actions (top right) */}
          {hasActions && (
            <div
              className={cn(
                'absolute top-2 right-2 z-10',
                'transition-opacity duration-200',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
            >
              <VideoTileActions
                participantId={participantId}
                isPinned={isPinned}
                showMuteAction={showMuteAction && !isLocal}
                onPin={onPin}
                onFullscreen={onFullscreen}
                onMute={onMute}
              />
            </div>
          )}

          {/* Bottom info bar with enhanced gradient */}
          <div className="absolute bottom-0 left-0 right-0 video-overlay-gradient px-3 py-2.5">
            <div className="flex items-center justify-between">
              {/* Name and badges */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-white truncate max-w-[150px] drop-shadow-sm">
                  {displayName}
                </span>
                {isScreenSharing && (
                  <div className="flex items-center gap-1 bg-blue-500/80 rounded px-1.5 py-0.5">
                    <MonitorUp className="h-3 w-3 text-white" aria-hidden="true" />
                    <span className="text-xs text-white font-medium">Sharing</span>
                  </div>
                )}
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-2">
                {/* Connection quality bars */}
                <QualityIndicator quality={quality} size="sm" />

                {/* Microphone status */}
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full p-1',
                    isAudioEnabled
                      ? isSpeaking
                        ? 'bg-green-500/80'
                        : 'bg-black/40'
                      : 'bg-red-500/80'
                  )}
                >
                  {isAudioEnabled ? (
                    <>
                      <Mic className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      <span className="sr-only">Microphone on</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      <span className="sr-only">Microphone muted</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  )
);

VideoTile.displayName = 'VideoTile';
