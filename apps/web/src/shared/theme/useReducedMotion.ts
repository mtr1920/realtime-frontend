import { useEffect } from 'react';
import { useMediaQuery } from '@/shared/hooks';

/**
 * Hook to detect user's reduced motion preference.
 * Also syncs the `reduce-motion` class on the document root.
 *
 * Uses the generic useMediaQuery hook internally for DRY compliance.
 */
export function useReducedMotion(): boolean {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Sync DOM class for CSS-based animations
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  return prefersReducedMotion;
}
