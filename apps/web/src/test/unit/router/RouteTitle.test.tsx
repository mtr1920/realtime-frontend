/**
 * RouteTitle Component Tests
 *
 * Tests for the RouteTitle component that auto-updates page titles.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { RouteTitle } from '@/app/router/RouteTitle';

// Mock TanStack Router
const mockPathname = vi.fn(() => '/dashboard');
vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) => {
    return select({ location: { pathname: mockPathname() } });
  },
}));

// Mock Zustand store
const mockSetPageTitle = vi.fn();
vi.mock('@/shared/stores/ui.store', () => ({
  useUIStore: (selector: (state: { setPageTitle: typeof mockSetPageTitle }) => unknown) => {
    return selector({ setPageTitle: mockSetPageTitle });
  },
}));

describe('RouteTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Initial Title';
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing (returns null)', () => {
    mockPathname.mockReturnValue('/dashboard');
    const { container } = render(<RouteTitle />);
    expect(container.innerHTML).toBe('');
  });

  it('sets page title for known route', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<RouteTitle />);

    expect(mockSetPageTitle).toHaveBeenCalledWith('Dashboard');
    expect(document.title).toBe('Dashboard | Xumane Recruit');
  });

  it('sets page title for sessions route', () => {
    mockPathname.mockReturnValue('/sessions');
    render(<RouteTitle />);

    expect(mockSetPageTitle).toHaveBeenCalledWith('Sessions');
    expect(document.title).toBe('Sessions | Xumane Recruit');
  });

  it('sets page title for dynamic session route', () => {
    mockPathname.mockReturnValue('/sessions/abc-123');
    render(<RouteTitle />);

    expect(mockSetPageTitle).toHaveBeenCalledWith('Session Details');
    expect(document.title).toBe('Session Details | Xumane Recruit');
  });

  it('clears title for unknown route', () => {
    mockPathname.mockReturnValue('/unknown/route');
    render(<RouteTitle />);

    expect(mockSetPageTitle).toHaveBeenCalledWith('');
    expect(document.title).toBe('Xumane Recruit');
  });

  it('sets title for admin routes', () => {
    mockPathname.mockReturnValue('/admin/domain-configs');
    render(<RouteTitle />);

    expect(mockSetPageTitle).toHaveBeenCalledWith('Domain Configs');
    expect(document.title).toBe('Domain Configs | Xumane Recruit');
  });
});
