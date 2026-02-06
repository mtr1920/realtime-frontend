/**
 * Lazy Loading for Session Room Media Components
 *
 * Config-driven lazy loading ensures media bundles are only
 * downloaded when video/audio modules are enabled.
 */

import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback for media components
 */
function MediaLoadingFallback() {
  return (
    <div
      className="flex h-full items-center justify-center bg-muted/30 rounded-lg"
      role="status"
      aria-label="Loading media components"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="h-6 w-6 motion-safe:animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Loading media...</p>
      </div>
    </div>
  );
}

/**
 * Lazy load VideoGridContainer - only when video is needed
 */
export const LazyVideoGridContainer = lazy(() =>
  import('./VideoGridContainer').then((m) => ({ default: m.VideoGridContainer }))
);

/**
 * Lazy load MediaInitializer - wraps media setup
 */
export const LazyMediaInitializer = lazy(() =>
  import('./MediaInitializer').then((m) => ({ default: m.MediaInitializer }))
);

/**
 * Lazy load ObserverWebRTCInitializer - receive-only WebRTC for observers
 */
export const LazyObserverWebRTCInitializer = lazy(() =>
  import('./ObserverWebRTCInitializer').then((m) => ({
    default: m.ObserverWebRTCInitializer,
  }))
);

/**
 * Props for SuspenseWrapper
 */
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Reusable Suspense wrapper for media components
 */
export function MediaSuspense({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback ?? <MediaLoadingFallback />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC to wrap lazy components with Suspense
 */
// eslint-disable-next-line react-refresh/only-export-components
export function withMediaSuspense<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  function SuspenseWrapper(props: P) {
    return (
      <MediaSuspense fallback={fallback}>
        <Component {...props} />
      </MediaSuspense>
    );
  }
  SuspenseWrapper.displayName = `withMediaSuspense(${Component.displayName ?? Component.name ?? 'Component'})`;
  return SuspenseWrapper;
}
