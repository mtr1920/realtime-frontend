/**
 * VideoPlaceholder Component
 *
 * Displays when video is unavailable:
 * - Camera off
 * - Loading state
 * - Connection issues
 */

import { forwardRef } from 'react';
import { VideoOff, Loader2, WifiOff, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

type PlaceholderReason = 'camera-off' | 'loading' | 'disconnected' | 'no-video';

interface VideoPlaceholderProps {
  /** Reason for showing placeholder */
  reason?: PlaceholderReason;
  /** Display name for the participant */
  displayName?: string;
  /** First letter of name for avatar fallback */
  initials?: string;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getPlaceholderContent(reason: PlaceholderReason) {
  switch (reason) {
    case 'camera-off':
      return {
        Icon: VideoOff,
        text: 'Camera off',
      };
    case 'loading':
      return {
        Icon: Loader2,
        text: 'Connecting...',
        animate: true,
      };
    case 'disconnected':
      return {
        Icon: WifiOff,
        text: 'Disconnected',
      };
    case 'no-video':
    default:
      return {
        Icon: User,
        text: null,
      };
  }
}

// =============================================================================
// Component
// =============================================================================

export const VideoPlaceholder = forwardRef<HTMLDivElement, VideoPlaceholderProps>(
  (
    {
      reason = 'camera-off',
      displayName,
      initials,
      className,
    },
    ref
  ) => {
    const { Icon, text, animate } = getPlaceholderContent(reason);
    const displayInitials = initials ?? displayName?.charAt(0).toUpperCase() ?? '?';

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center bg-muted',
          className
        )}
      >
        {/* Avatar Circle */}
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
          {reason === 'no-video' || reason === 'camera-off' ? (
            <span className="text-2xl font-semibold text-muted-foreground">
              {displayInitials}
            </span>
          ) : (
            <Icon
              className={cn(
                'h-8 w-8 text-muted-foreground',
                animate && 'motion-safe:animate-spin'
              )}
            />
          )}
        </div>

        {/* Status text */}
        {text && (
          <span className="text-sm text-muted-foreground">{text}</span>
        )}

        {/* Display name */}
        {displayName && (
          <span className="mt-1 text-xs text-muted-foreground/70 max-w-[80%] truncate">
            {displayName}
          </span>
        )}
      </div>
    );
  }
);

VideoPlaceholder.displayName = 'VideoPlaceholder';
