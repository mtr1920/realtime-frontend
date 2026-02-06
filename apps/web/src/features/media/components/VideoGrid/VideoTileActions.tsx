/**
 * VideoTileActions Component
 *
 * Hover-reveal action buttons for video tiles.
 * Provides pin, fullscreen, and mute actions.
 */

import { forwardRef, memo } from 'react';
import { Pin, Maximize2, VolumeX } from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface VideoTileActionsProps {
  /** Participant ID for actions */
  participantId: string;
  /** Whether this tile is currently pinned */
  isPinned?: boolean;
  /** Whether to show the mute action (for facilitators) */
  showMuteAction?: boolean;
  /** Called when pin is toggled */
  onPin?: (participantId: string) => void;
  /** Called when fullscreen is requested */
  onFullscreen?: (participantId: string) => void;
  /** Called when mute is requested */
  onMute?: (participantId: string) => void;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const VideoTileActions = memo(
  forwardRef<HTMLDivElement, VideoTileActionsProps>(
    (
      {
        participantId,
        isPinned = false,
        showMuteAction = false,
        onPin,
        onFullscreen,
        onMute,
        className,
      },
      ref
    ) => {
      return (
        <TooltipProvider delayDuration={300}>
          <div
            ref={ref}
            className={cn(
              'hover-reveal flex items-center gap-1',
              className
            )}
          >
            {/* Pin Button */}
            {onPin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 bg-black/40 hover:bg-black/60 text-white press-effect',
                      isPinned && 'bg-primary/80 hover:bg-primary/90'
                    )}
                    onClick={() => onPin(participantId)}
                    aria-label={isPinned ? 'Unpin participant' : 'Pin participant'}
                    aria-pressed={isPinned}
                  >
                    <Pin className={cn('h-4 w-4', isPinned && 'fill-current')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isPinned ? 'Unpin' : 'Pin'}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Fullscreen Button */}
            {onFullscreen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white press-effect"
                    onClick={() => onFullscreen(participantId)}
                    aria-label="View fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Fullscreen</TooltipContent>
              </Tooltip>
            )}

            {/* Mute Button (Facilitator only) */}
            {showMuteAction && onMute && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-black/40 hover:bg-black/60 text-white press-effect"
                    onClick={() => onMute(participantId)}
                    aria-label="Mute participant"
                  >
                    <VolumeX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Mute</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      );
    }
  )
);

VideoTileActions.displayName = 'VideoTileActions';
