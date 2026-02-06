/**
 * ScreenShareView Component
 *
 * Displays screen share with:
 * - Full-width view
 * - Presenter info
 * - Stop button (for local share)
 */

import { useRef, useEffect, forwardRef } from 'react';
import { MonitorUp, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ScreenShareViewProps {
  /** Stream to display */
  stream: MediaStream | null;
  /** Name of the person sharing */
  presenterName: string;
  /** Whether this is the local user's screen share */
  isLocal?: boolean;
  /** Callback when stop button is clicked (for local share) */
  onStop?: () => void;
  /** Whether in fullscreen mode */
  isFullscreen?: boolean;
  /** Callback to toggle fullscreen */
  onFullscreenToggle?: () => void;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export const ScreenShareView = forwardRef<HTMLDivElement, ScreenShareViewProps>(
  (
    {
      stream,
      presenterName,
      isLocal = false,
      onStop,
      isFullscreen = false,
      onFullscreenToggle,
      className,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);

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
    }, [stream]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative bg-black rounded-lg overflow-hidden',
          className
        )}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-contain"
        />

        {/* Top info bar */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            {/* Presenter info */}
            <div className="flex items-center gap-2 text-white">
              <MonitorUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isLocal ? 'You are sharing your screen' : `${presenterName} is presenting`}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Fullscreen toggle */}
              {onFullscreenToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={onFullscreenToggle}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Stop button (for local share) */}
              {isLocal && onStop && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={onStop}
                >
                  <X className="h-4 w-4 mr-1" />
                  Stop sharing
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* No stream placeholder */}
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <MonitorUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Waiting for screen share...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ScreenShareView.displayName = 'ScreenShareView';
