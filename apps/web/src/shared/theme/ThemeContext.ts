import { createContext } from 'react';
import type { ResolvedTheme } from '@/shared/theme/useTheme';
import type { Theme } from '@/types';

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  prefersReducedMotion: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
