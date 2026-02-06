/**
 * AI Route Suggestion Service
 * Uses the backend to proxy AI route suggestions.
 * The backend handles the AI interaction, while the frontend filters routes by permissions.
 */

import type { Permission } from '@/types';

import { apiClient } from './api-client';

/**
 * Route definition for the AI to understand available routes.
 */
export interface RouteDefinition {
  path: string;
  label: string;
  description: string;
  keywords?: string[];
  permission?: string;
}

/**
 * Route definition without permission (sent to backend).
 */
interface RouteDefinitionForBackend {
  path: string;
  label: string;
  description: string;
  keywords?: string[];
}

/**
 * Complete registry of available routes with descriptions.
 * The permission field is used for frontend filtering before sending to backend.
 */
export const ROUTE_REGISTRY: RouteDefinition[] = [
  // Navigation
  { path: '/dashboard', label: 'Dashboard', description: 'Main dashboard with overview stats and quick actions', keywords: ['home', 'overview', 'main', 'stats'] },
  { path: '/sessions', label: 'Sessions', description: 'List all sessions, meetings, interviews', keywords: ['meetings', 'interviews', 'calls', 'list'] },
  { path: '/sessions/create', label: 'Create Session', description: 'Create a new session or meeting', keywords: ['new', 'start', 'schedule', 'book'] },
  { path: '/workspaces', label: 'Workspaces', description: 'Manage workspaces and projects', keywords: ['projects', 'teams', 'groups'], permission: 'canViewWorkspace' },
  { path: '/users', label: 'Users', description: 'Manage team members and user accounts', keywords: ['team', 'members', 'people', 'accounts'], permission: 'canViewUsers' },
  { path: '/settings', label: 'Settings', description: 'Personal and account settings', keywords: ['preferences', 'account', 'profile', 'config'] },

  // Admin routes
  { path: '/admin', label: 'Admin Panel', description: 'System administration dashboard', keywords: ['system', 'admin', 'control'], permission: 'canAccessAdmin' },
  { path: '/admin/domain-configs', label: 'Domain Configs', description: 'Configure domain types and business rules', keywords: ['domains', 'types', 'config', 'rules'], permission: 'canAccessAdmin' },
  { path: '/admin/webhooks', label: 'Webhooks', description: 'Manage webhook integrations', keywords: ['hooks', 'integrations', 'events', 'notifications'], permission: 'canAccessAdmin' },
  { path: '/admin/api-keys', label: 'API Keys', description: 'Manage API keys for external integrations', keywords: ['api', 'keys', 'tokens', 'access'], permission: 'canAccessAdmin' },
  { path: '/admin/audit-logs', label: 'Audit Logs', description: 'View system audit logs and activity history', keywords: ['logs', 'audit', 'history', 'activity', 'security'], permission: 'canAccessAdmin' },
  { path: '/admin/settings', label: 'Tenant Settings', description: 'Tenant-wide configuration and settings', keywords: ['tenant', 'organization', 'company'], permission: 'canAccessAdmin' },
  { path: '/admin/outcomes', label: 'Outcomes', description: 'View and manage session outcomes', keywords: ['results', 'outcomes', 'reports'], permission: 'canAccessAdmin' },
  { path: '/admin/integrations', label: 'Integrations', description: 'Configure third-party integrations', keywords: ['connect', 'third-party', 'external', 'services'], permission: 'canAccessAdmin' },
];

/**
 * AI suggestion response
 */
export interface AISuggestion {
  path: string | null;
  reason: string;
  route?: RouteDefinition;
}

/**
 * Backend API response type
 */
interface SuggestRouteResponse {
  suggestion: {
    path: string | null;
    reason: string;
    route?: RouteDefinitionForBackend;
  };
}

/**
 * Filter routes by user permissions.
 * Routes without a permission requirement are always included.
 *
 * @param hasPermission - Function to check if user has a specific permission
 * @returns Filtered list of routes the user can access
 */
export function filterRoutesByPermissions(
  hasPermission: (permission: Permission) => boolean
): RouteDefinition[] {
  return ROUTE_REGISTRY.filter((route) => {
    // Routes without permission requirements are accessible to all
    if (!route.permission) {
      return true;
    }
    // Check if user has the required permission
    return hasPermission(route.permission as Permission);
  });
}

/**
 * Query the backend for a route suggestion.
 * The backend proxies the request to the AI model.
 *
 * @param query - The user's search query
 * @param allowedRoutes - Permission-filtered routes to send to the backend
 * @returns AI suggestion or null if failed/no match
 */
export async function suggestRoute(
  query: string,
  allowedRoutes: RouteDefinition[]
): Promise<AISuggestion | null> {
  if (!query || query.trim().length < 2) {
    return null;
  }

  if (allowedRoutes.length === 0) {
    return null;
  }

  try {
    // Strip permission field before sending to backend
    const routesForBackend: RouteDefinitionForBackend[] = allowedRoutes.map(
      ({ permission: _permission, ...rest }) => rest
    );

    const response = await apiClient.post<SuggestRouteResponse>(
      '/v1/ai/suggest-route',
      { query: query.trim(), routes: routesForBackend }
    );

    const { suggestion } = response;

    // Find the full route (with permission) from the original list
    const fullRoute = suggestion.path
      ? allowedRoutes.find((r) => r.path === suggestion.path)
      : undefined;

    return {
      path: suggestion.path,
      reason: suggestion.reason,
      route: fullRoute,
    };
  } catch {
    // Return null on any error - the backend already handles graceful errors
    return null;
  }
}
