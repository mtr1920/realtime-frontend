import { useState, useEffect } from 'react';

/**
 * Hook to detect and respond to browser online/offline state changes.
 * SSR-safe with proper cleanup.
 *
 * Uses the same pattern as useMediaQuery for consistency.
 *
 * @returns Whether the browser is online
 *
 * @example
 * const isOnline = useOnline();
 */
export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sync state in case it changed between render and effect
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
