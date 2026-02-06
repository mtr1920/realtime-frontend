import { useMediaQuery } from '@/shared/hooks';

export type SystemColorScheme = 'light' | 'dark';

/**
 * Hook to detect and respond to OS color scheme preference changes.
 * Returns the current system preference ('light' or 'dark').
 *
 * Uses the generic useMediaQuery hook internally for DRY compliance.
 */
export function useSystemPreference(): SystemColorScheme {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDark ? 'dark' : 'light';
}
