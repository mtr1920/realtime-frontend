/**
 * RouteTitle Component
 *
 * Automatically updates the page title based on the current route.
 * Place in DashboardLayout to enable automatic title updates for all dashboard pages.
 */

import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useUIStore } from '@/shared/stores/ui.store';
import { getRouteTitle } from './route-titles';

const APP_NAME = 'Xumane Recruit';

/**
 * Automatically updates page title based on current route.
 * Renders nothing - only manages side effects.
 */
export function RouteTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const setPageTitle = useUIStore((state) => state.setPageTitle);

  useEffect(() => {
    const title = getRouteTitle(pathname);

    if (title) {
      setPageTitle(title);
      document.title = `${title} | ${APP_NAME}`;
    } else {
      // Clear title for unknown routes (let page set it manually if needed)
      setPageTitle('');
      document.title = APP_NAME;
    }
  }, [pathname, setPageTitle]);

  // Render nothing - this component only manages side effects
  return null;
}
