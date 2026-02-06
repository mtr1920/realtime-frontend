import { WifiOff, RefreshCw } from 'lucide-react';
import { Button, cn, usePrefersReducedMotion } from '@/shared/ui';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

/**
 * Banner displayed when the user loses internet connection.
 * Automatically shown/hidden based on network status.
 *
 * Note: useCallback removed - React Compiler handles memoization automatically.
 */
export function OfflineBanner() {
  const { isOffline, checkConnection } = useNetworkStatus();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Don't render when online
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        // Base layout
        'fixed top-0 left-0 right-0 z-[60]',
        'flex items-center justify-between gap-4',
        'px-4 py-3 md:px-6',
        // Glassmorphism with warning accent
        'backdrop-blur-md',
        'border-b border-warning/40',
        'bg-warning/10',
        'dark:border-warning/30 dark:bg-warning/5',
        // Animation
        !prefersReducedMotion && 'animate-slide-in-from-top'
      )}
    >
      {/* Screen reader text */}
      <span className="sr-only">
        Network connection lost. Attempting to reconnect automatically.
      </span>

      {/* Icon and message */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            'bg-warning/20 dark:bg-warning/10'
          )}
        >
          <WifiOff
            className="h-4 w-4 text-warning-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            No internet connection
          </span>
          <span className="text-sm text-muted-foreground">
            Reconnecting automatically...
          </span>
        </div>
      </div>

      {/* Retry button */}
      <Button
        variant="outline"
        size="sm"
        onClick={checkConnection}
        className={cn(
          'shrink-0',
          'border-warning/40 hover:bg-warning/10',
          'dark:border-warning/30 dark:hover:bg-warning/5'
        )}
      >
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
