/**
 * SessionLoadingSkeleton
 *
 * Shimmer skeleton matching the session room layout.
 * Provides visual feedback while the room is loading.
 */

import { Skeleton } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface SessionLoadingSkeletonProps {
  /** Additional CSS class */
  className?: string;
}

export function SessionLoadingSkeleton({ className }: SessionLoadingSkeletonProps) {
  return (
    <div className={cn('flex h-full flex-col lg:flex-row gap-4 p-4', className)}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        {/* Video Grid Skeleton */}
        <main className="flex-1 min-h-0">
          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Video Tile Skeletons */}
            {[0, 1, 2, 3].map((index) => (
              <VideoTileSkeleton key={index} delay={index} />
            ))}
          </div>
        </main>

        {/* Controls Skeleton */}
        <div className="flex justify-center">
          <div className="glass-card rounded-full px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="w-px h-6 bg-border mx-1" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <div className="glass-card rounded-lg h-full p-4 space-y-4">
          {/* Tab Header */}
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>

          {/* Participant List Skeleton */}
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <ParticipantItemSkeleton key={index} delay={index} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function VideoTileSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className={cn(
        'aspect-video rounded-xl bg-muted overflow-hidden',
        'motion-safe:animate-fade-in',
        delay === 0 && 'stagger-1',
        delay === 1 && 'stagger-2',
        delay === 2 && 'stagger-3',
        delay === 3 && 'stagger-4'
      )}
      style={{ animationFillMode: 'backwards' }}
    >
      <div className="relative h-full w-full shimmer-bg motion-safe:animate-shimmer">
        {/* Avatar placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>

        {/* Bottom bar placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantItemSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-2',
        'motion-safe:animate-fade-in',
        delay === 0 && 'stagger-1',
        delay === 1 && 'stagger-2',
        delay === 2 && 'stagger-3',
        delay === 3 && 'stagger-4'
      )}
      style={{ animationFillMode: 'backwards' }}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
