/**
 * usePageTitle Hook
 *
 * Override automatic route-based title with a custom title.
 * Use sparingly - prefer centralized route-titles.ts config.
 *
 * Most pages don't need this hook since RouteTitle component
 * automatically sets titles based on route configuration.
 *
 * Use cases for manual override:
 * - Dynamic titles (e.g., "Session: Project Alpha")
 * - Titles that depend on fetched data
 * - Non-dashboard pages that need custom titles
 */

import { useEffect } from 'react';
import { useUIStore } from '@/shared/stores/ui.store';

const APP_NAME = 'Xumane Recruit';

/**
 * Override the automatic route-based page title.
 * @param title - The page title to display (empty string to clear)
 */
export function usePageTitle(title: string): void {
  const setPageTitle = useUIStore((state) => state.setPageTitle);

  useEffect(() => {
    if (title) {
      setPageTitle(title);
      document.title = `${title} | ${APP_NAME}`;
    }
    // No cleanup - let RouteTitle handle resets on navigation
  }, [title, setPageTitle]);
}
