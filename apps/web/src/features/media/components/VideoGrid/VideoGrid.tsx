/**
 * VideoGrid Component
 *
 * Responsive grid layout for video tiles:
 * - Adapts based on participant count
 * - Screen share mode with thumbnails
 * - Optimized for different screen sizes
 */

import { forwardRef, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { VideoTile } from './VideoTile';
import { ScrollArea } from '@/shared/ui';
import type { NetworkQualityLevel } from '../../types/webrtc.types';

// =============================================================================
// Types
// =============================================================================

export interface VideoParticipant {
  participantId: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  quality?: NetworkQualityLevel;
  /** Participant connection state for reconnecting overlay */
  connectionState?: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

interface VideoGridProps {
  /** List of participants to display */
  participants: VideoParticipant[];
  /** Screen share stream (takes priority layout) */
  screenShare?: {
    participantId: string;
    displayName: string;
    stream: MediaStream;
  } | null;
  /** Additional class name */
  className?: string;
  /** Gap between tiles (in Tailwind units) */
  gap?: 1 | 2 | 3 | 4;
}

// =============================================================================
// Grid Layout Logic
// =============================================================================

/**
 * Determine grid columns based on participant count
 *
 * | Participants | Layout     |
 * |-------------|------------|
 * | 1           | 1x1 full   |
 * | 2           | 1x2 side-by-side |
 * | 3-4         | 2x2 grid   |
 * | 5-6         | 2x3 grid   |
 * | 7-9         | 3x3 grid   |
 * | 10+         | 4x3 with scroll |
 */
function getGridLayout(count: number): {
  cols: number;
  rows: number;
  className: string;
} {
  if (count === 0) {
    return { cols: 1, rows: 1, className: 'grid-cols-1' };
  }
  if (count === 1) {
    return { cols: 1, rows: 1, className: 'grid-cols-1' };
  }
  if (count === 2) {
    return { cols: 2, rows: 1, className: 'grid-cols-2' };
  }
  if (count <= 4) {
    return { cols: 2, rows: 2, className: 'grid-cols-2' };
  }
  if (count <= 6) {
    return { cols: 3, rows: 2, className: 'grid-cols-3' };
  }
  if (count <= 9) {
    return { cols: 3, rows: 3, className: 'grid-cols-3' };
  }
  // 10+ participants - 4 columns with scroll
  return { cols: 4, rows: Math.ceil(count / 4), className: 'grid-cols-4' };
}

// =============================================================================
// Component
// =============================================================================

export const VideoGrid = forwardRef<HTMLDivElement, VideoGridProps>(
  ({ participants, screenShare, className, gap = 2 }, ref) => {
    const gapClass = {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
    }[gap];

    // Get grid layout
    const layout = useMemo(
      () => getGridLayout(participants.length),
      [participants.length]
    );

    // Screen share mode: full-width screen share with thumbnails below
    if (screenShare) {
      return (
        <div ref={ref} className={cn('flex flex-col h-full', gapClass, className)}>
          {/* Screen share - takes most of the space */}
          <div className="flex-1 min-h-0">
            <VideoTile
              participantId={screenShare.participantId}
              displayName={`${screenShare.displayName}'s screen`}
              stream={screenShare.stream}
              isVideoEnabled
              isAudioEnabled={false}
              className="h-full w-full"
            />
          </div>

          {/* Participant thumbnails - horizontal scroll */}
          <div className="h-28 shrink-0 overflow-x-auto">
            <div className="flex h-full gap-2 pb-2">
              {participants.map((participant) => (
                <VideoTile
                  key={participant.participantId}
                  {...participant}
                  mirrored={participant.isLocal}
                  className="h-full w-40 shrink-0"
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Normal grid mode
    const needsScroll = participants.length > 9;

    const gridContent = (
      <div
        className={cn(
          'grid h-full w-full auto-rows-fr',
          layout.className,
          gapClass,
          needsScroll && 'auto-rows-auto'
        )}
      >
        {participants.map((participant) => (
          <VideoTile
            key={participant.participantId}
            {...participant}
            mirrored={participant.isLocal}
          />
        ))}
      </div>
    );

    if (needsScroll) {
      return (
        <div ref={ref} className={cn('h-full', className)}>
          <ScrollArea className="h-full">
            {gridContent}
          </ScrollArea>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('h-full', className)}>
        {gridContent}
      </div>
    );
  }
);

VideoGrid.displayName = 'VideoGrid';
