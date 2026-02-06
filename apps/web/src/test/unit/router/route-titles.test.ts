/**
 * Route Titles Unit Tests
 *
 * Tests for the route title configuration and getRouteTitle function.
 */

import { describe, it, expect } from 'vitest';
import { getRouteTitle, routeTitles, dynamicRouteTitles } from '@/app/router/route-titles';

describe('getRouteTitle', () => {
  describe('static routes', () => {
    it('returns title for dashboard', () => {
      expect(getRouteTitle('/dashboard')).toBe('Dashboard');
    });

    it('returns title for sessions', () => {
      expect(getRouteTitle('/sessions')).toBe('Sessions');
    });

    it('returns title for sessions/create', () => {
      expect(getRouteTitle('/sessions/create')).toBe('Create Session');
    });

    it('returns title for workspaces', () => {
      expect(getRouteTitle('/workspaces')).toBe('Workspaces');
    });

    it('returns title for users', () => {
      expect(getRouteTitle('/users')).toBe('Users');
    });

    it('returns title for settings', () => {
      expect(getRouteTitle('/settings')).toBe('Settings');
    });

    it('returns title for admin', () => {
      expect(getRouteTitle('/admin')).toBe('Admin');
    });

    it('returns title for admin/domain-configs', () => {
      expect(getRouteTitle('/admin/domain-configs')).toBe('Domain Configs');
    });

    it('returns title for admin/webhooks', () => {
      expect(getRouteTitle('/admin/webhooks')).toBe('Webhooks');
    });

    it('returns title for admin/api-keys', () => {
      expect(getRouteTitle('/admin/api-keys')).toBe('API Keys');
    });

    it('returns title for admin/audit-logs', () => {
      expect(getRouteTitle('/admin/audit-logs')).toBe('Audit Logs');
    });

    it('returns title for admin/settings', () => {
      expect(getRouteTitle('/admin/settings')).toBe('Tenant Settings');
    });

    it('returns title for admin/outcomes', () => {
      expect(getRouteTitle('/admin/outcomes')).toBe('Outcomes');
    });

    it('returns title for admin/integrations', () => {
      expect(getRouteTitle('/admin/integrations')).toBe('Integrations');
    });
  });

  describe('dynamic routes', () => {
    it('returns title for session details with UUID', () => {
      expect(getRouteTitle('/sessions/abc-123-def')).toBe('Session Details');
    });

    it('returns title for session lobby', () => {
      expect(getRouteTitle('/sessions/abc-123/lobby')).toBe('Session Lobby');
    });

    it('returns title for session room', () => {
      expect(getRouteTitle('/sessions/abc-123/room')).toBe('Session Room');
    });

    it('returns title for workspace details', () => {
      expect(getRouteTitle('/workspaces/ws-789')).toBe('Workspace Details');
    });

    it('returns title for user details', () => {
      expect(getRouteTitle('/users/user-456')).toBe('User Details');
    });

    it('returns title for join page', () => {
      expect(getRouteTitle('/join/share-id-123')).toBe('Join Session');
    });
  });

  describe('unknown routes', () => {
    it('returns null for unknown routes', () => {
      expect(getRouteTitle('/unknown/path')).toBeNull();
    });

    it('returns null for empty path', () => {
      expect(getRouteTitle('')).toBeNull();
    });

    it('returns null for root path', () => {
      expect(getRouteTitle('/')).toBeNull();
    });
  });

  describe('priority', () => {
    it('prioritizes static routes over dynamic patterns', () => {
      // /sessions/create should match static route, not dynamic pattern
      expect(getRouteTitle('/sessions/create')).toBe('Create Session');
    });
  });
});

describe('routeTitles', () => {
  it('has all main navigation routes', () => {
    expect(routeTitles['/dashboard']).toBeDefined();
    expect(routeTitles['/sessions']).toBeDefined();
    expect(routeTitles['/workspaces']).toBeDefined();
    expect(routeTitles['/users']).toBeDefined();
    expect(routeTitles['/settings']).toBeDefined();
  });

  it('has all admin routes', () => {
    expect(routeTitles['/admin']).toBeDefined();
    expect(routeTitles['/admin/domain-configs']).toBeDefined();
    expect(routeTitles['/admin/webhooks']).toBeDefined();
    expect(routeTitles['/admin/api-keys']).toBeDefined();
    expect(routeTitles['/admin/audit-logs']).toBeDefined();
    expect(routeTitles['/admin/settings']).toBeDefined();
    expect(routeTitles['/admin/outcomes']).toBeDefined();
    expect(routeTitles['/admin/integrations']).toBeDefined();
  });
});

describe('dynamicRouteTitles', () => {
  it('has patterns for all dynamic routes', () => {
    expect(dynamicRouteTitles.length).toBeGreaterThan(0);
  });

  it('each pattern has a getTitle function', () => {
    for (const { pattern, getTitle } of dynamicRouteTitles) {
      expect(pattern).toBeInstanceOf(RegExp);
      expect(typeof getTitle).toBe('function');
    }
  });
});
