/**
 * LocalVideo Component
 *
 * Displays the local camera preview with:
 * - Mirrored self-view
 * - Loading and error states
 * - Video off placeholder
 */

import { useRef, useEffect, forwardRef } from 'react';
import { VideoOff, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface LocalVideoProps {
  /** MediaStream to display */
  stream: MediaStream | null;
  /** Whether video is enabled */
  videoEnabled?: boolean;
  /** Whether to mirror the video (default: true for self-view) */
  mirrored?: boolean;
  /** Whether the stream is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Additional class name */
  className?: string;
  /** Object-fit style */
  objectFit?: 'cover' | 'contain';
  /** Label to show in corner */
  label?: string;
  /** Muted audio (default: true for self-view) */
  muted?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const LocalVideo = forwardRef<HTMLVideoElement, LocalVideoProps>(
  (
    {
      stream,
      videoEnabled = true,
      mirrored = true,
      isLoading = false,
      error = null,
      className,
      objectFit = 'cover',
      label,
      muted = true,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalRef;

    // Attach stream to video element
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (stream) {
        video.srcObject = stream;
      } else {
        video.srcObject = null;
      }

      return () => {
        video.srcObject = null;
      };
    }, [stream, videoRef]);

    // Show placeholder when video is off or no stream
    const showPlaceholder = !stream || !videoEnabled || error;

    return (
      <div
        className={cn(
          'relative bg-muted overflow-hidden rounded-lg',
          className
        )}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            objectFit === 'contain' && 'object-contain',
            mirrored && 'scale-x-[-1]',
            showPlaceholder && 'invisible'
          )}
        />

        {/* Placeholder when video is off */}
        {showPlaceholder && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <VideoOff className="h-8 w-8" />
              <span className="text-sm">Camera off</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <Loader2 className="h-8 w-8 motion-safe:animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 p-4">
            <p className="text-center text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Label */}
        {label && (
          <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {label}
          </div>
        )}
      </div>
    );
  }
);

LocalVideo.displayName = 'LocalVideo';
