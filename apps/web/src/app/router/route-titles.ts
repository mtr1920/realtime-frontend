/**
 * Route Titles Configuration
 *
 * Centralized route-to-title mapping for automatic page title updates.
 * Used by RouteTitle component to update the header and document title.
 */

/**
 * Static route to title mapping.
 * Keys are exact pathname matches.
 */
export const routeTitles: Record<string, string> = {
  // Main navigation
  '/dashboard': 'Dashboard',
  '/sessions': 'Sessions',
  '/sessions/create': 'Create Session',
  '/workspaces': 'Workspaces',
  '/workspaces/create': 'Create Workspace',
  '/users': 'Users',
  '/settings': 'Settings',

  // Admin section
  '/admin': 'Admin',
  '/admin/domain-configs': 'Domain Configs',
  '/admin/webhooks': 'Webhooks',
  '/admin/api-keys': 'API Keys',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/settings': 'Tenant Settings',
  '/admin/outcomes': 'Outcomes',
  '/admin/integrations': 'Integrations',
};

/**
 * Dynamic route patterns with title generators.
 * Order matters - more specific patterns should come first.
 */
export const dynamicRouteTitles: Array<{
  pattern: RegExp;
  getTitle: (params: Record<string, string>) => string;
}> = [
  {
    pattern: /^\/sessions\/([^/]+)\/lobby$/,
    getTitle: () => 'Session Lobby',
  },
  {
    pattern: /^\/sessions\/([^/]+)\/room$/,
    getTitle: () => 'Session Room',
  },
  {
    pattern: /^\/sessions\/([^/]+)$/,
    getTitle: () => 'Session Details',
  },
  {
    pattern: /^\/workspaces\/([^/]+)$/,
    getTitle: () => 'Workspace Details',
  },
  {
    pattern: /^\/users\/([^/]+)$/,
    getTitle: () => 'User Details',
  },
  {
    pattern: /^\/join\/([^/]+)$/,
    getTitle: () => 'Join Session',
  },
];

/**
 * Get page title for a given pathname.
 * @param pathname - The current route pathname
 * @returns The page title or null if no match found
 */
export function getRouteTitle(pathname: string): string | null {
  // Check static routes first (exact match)
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Check dynamic routes
  for (const { pattern, getTitle } of dynamicRouteTitles) {
    const match = pathname.match(pattern);
    if (match) {
      // Extract params from match groups if needed in the future
      const params: Record<string, string> = {};
      return getTitle(params);
    }
  }

  return null;
}
