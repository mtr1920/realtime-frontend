/**
 * CameraFrame Component
 *
 * Viewfinder-style corner overlay for camera preview.
 * Adds a professional "viewfinder" aesthetic to the video preview.
 */

import { memo } from 'react';
import { cn } from '@/shared/lib/utils';

interface CameraFrameProps {
  /** Additional class name */
  className?: string;
}

export const CameraFrame = memo(function CameraFrame({ className }: CameraFrameProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none',
        className
      )}
      aria-hidden="true"
    >
      {/* Top Left Corner */}
      <div className="absolute top-3 left-3">
        <div className="w-6 h-[2px] bg-white/70" />
        <div className="w-[2px] h-6 bg-white/70" />
      </div>

      {/* Top Right Corner */}
      <div className="absolute top-3 right-3">
        <div className="w-6 h-[2px] bg-white/70 ml-auto" />
        <div className="w-[2px] h-6 bg-white/70 ml-auto" />
      </div>

      {/* Bottom Left Corner */}
      <div className="absolute bottom-3 left-3">
        <div className="w-[2px] h-6 bg-white/70" />
        <div className="w-6 h-[2px] bg-white/70" />
      </div>

      {/* Bottom Right Corner */}
      <div className="absolute bottom-3 right-3">
        <div className="w-[2px] h-6 bg-white/70 ml-auto" />
        <div className="w-6 h-[2px] bg-white/70 ml-auto" />
      </div>

      {/* Center Focus Point (subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
        </div>
      </div>
    </div>
  );
});

CameraFrame.displayName = 'CameraFrame';
