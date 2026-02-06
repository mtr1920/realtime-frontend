import { useState, useEffect } from 'react';

/**
 * Hook that returns whether a media query matches.
 *
 * @param query - The media query string (e.g., '(min-width: 768px)')
 * @returns Whether the media query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 *   return (
 *     <div>
 *       {isDesktop ? <DesktopNav /> : <MobileNav />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Update state when media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Add listener
    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

// Breakpoint hooks for common use cases
const breakpoints = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

/**
 * Hook that returns whether the viewport is at least the specified breakpoint.
 *
 * @example
 * ```tsx
 * function Component() {
 *   const isLg = useBreakpoint('lg'); // >= 1024px
 *   return isLg ? <DesktopLayout /> : <MobileLayout />;
 * }
 * ```
 */
export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  return useMediaQuery(breakpoints[breakpoint]);
}

/**
 * Hook that returns whether the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook that returns whether the user prefers dark color scheme.
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
