import type { ReactNode } from 'react';
import { useTheme } from '@/shared/theme/useTheme';
import { useReducedMotion } from '@/shared/theme/useReducedMotion';
import { ThemeContext, type ThemeContextValue } from '@/shared/theme/ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider that initializes theme synchronization and exposes theme context.
 * Wraps the app to ensure theme hooks are called at the root level.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    prefersReducedMotion,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
