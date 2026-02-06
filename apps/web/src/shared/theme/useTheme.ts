import { useEffect } from 'react';
import { useUIStore } from '@/shared/stores/ui.store';
import type { Theme } from '@/types';
import { useSystemPreference } from './useSystemPreference';

export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

interface UseThemeReturn {
  /** The user's theme preference ('light', 'dark', 'system', or 'high-contrast') */
  theme: Theme;
  /** The actual applied theme after resolving 'system' preference */
  resolvedTheme: ResolvedTheme;
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
  /** Toggle through themes: light -> dark -> system -> light */
  toggleTheme: () => void;
}

/**
 * Hook to manage theme state, synced with DOM and localStorage.
 * Uses the UI store for persistence and system preference for 'system' mode.
 *
 * Note: useCallback removed - React Compiler handles memoization automatically.
 */
export function useTheme(): UseThemeReturn {
  const theme = useUIStore((state) => state.theme);
  const resolvedTheme = useUIStore((state) => state.resolvedTheme);
  const setThemeStore = useUIStore((state) => state.setTheme);
  const setResolvedTheme = useUIStore((state) => state.setResolvedTheme);

  const systemPreference = useSystemPreference();

  // Resolve the actual theme based on user preference and system
  const resolveTheme = (userTheme: Theme): ResolvedTheme => {
    if (userTheme === 'system') {
      return systemPreference;
    }
    return userTheme;
  };

  // Apply theme class to DOM
  const applyThemeToDOM = (resolved: ResolvedTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else if (resolved === 'high-contrast') {
      root.classList.add('high-contrast');
    }
  };

  // Sync resolved theme when theme or system preference changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyThemeToDOM(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setResolvedTheme is a stable Zustand action, resolveTheme/applyThemeToDOM are stable functions
  }, [theme, systemPreference]);

  // Set theme with store update
  const setTheme = (newTheme: Theme) => {
    setThemeStore(newTheme);
  };

  // Toggle based on resolved appearance: if light, go dark; if dark, go light
  const toggleTheme = () => {
    const nextTheme: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
