import { useContext } from 'react';
import { ThemeContext } from '@/shared/theme/ThemeContext';

/**
 * Hook to access theme context. Must be used within ThemeProvider.
 * Use this when you need theme values without direct store access.
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
