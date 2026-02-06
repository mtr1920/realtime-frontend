import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNetworkStore } from '@/shared/stores/network.store';
import { useOnline } from './useOnline';

/**
 * Hook to manage network status, synced with store and toast notifications.
 * Uses the useOnline hook for browser state detection.
 *
 * Note: useCallback removed - React Compiler handles memoization automatically.
 */
export function useNetworkStatus() {
  const status = useNetworkStore((state) => state.status);
  const lastOnlineAt = useNetworkStore((state) => state.lastOnlineAt);
  const setOnline = useNetworkStore((state) => state.setOnline);
  const setOffline = useNetworkStore((state) => state.setOffline);

  // Browser online state from dedicated hook
  const isOnline = useOnline();

  // Track toast state to avoid duplicates
  const hasShownOfflineToastRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Sync browser state to store and show toasts
  useEffect(() => {
    if (isOnline) {
      setOnline();

      // Show "back online" toast only if we were showing offline toast
      if (hasShownOfflineToastRef.current) {
        hasShownOfflineToastRef.current = false;
        toast.success('Back online!', {
          description: 'Your connection has been restored.',
          id: 'network-status',
          duration: 3000,
        });
      }
    } else {
      setOffline();

      // Show offline toast only after initialization
      if (isInitializedRef.current && !hasShownOfflineToastRef.current) {
        hasShownOfflineToastRef.current = true;
        toast.warning('No internet connection', {
          description: 'Attempting to reconnect automatically...',
          id: 'network-status',
          duration: Infinity,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOnline/setOffline are stable Zustand actions
  }, [isOnline]);

  // Mark as initialized after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializedRef.current = true;

      // If already offline on mount, show the toast
      if (!navigator.onLine) {
        hasShownOfflineToastRef.current = true;
        toast.warning('No internet connection', {
          description: 'Attempting to reconnect automatically...',
          id: 'network-status',
          duration: Infinity,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Manual retry function (for retry button)
  const checkConnection = () => {
    // Force re-check by triggering the online event if we're actually online
    if (navigator.onLine && !isOnline) {
      window.dispatchEvent(new Event('online'));
    }
  };

  return {
    isOnline: status === 'online',
    isOffline: status === 'offline',
    status,
    lastOnlineAt,
    checkConnection,
  };
}

export type UseNetworkStatusReturn = ReturnType<typeof useNetworkStatus>;
