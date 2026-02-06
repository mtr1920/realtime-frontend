import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '@/shared/theme/useTheme';
import { useUIStore } from '@/shared/stores/ui.store';

// Mock matchMedia
const createMockMatchMedia = (prefersDark: boolean, prefersReducedMotion: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches:
      query === '(prefers-color-scheme: dark)'
        ? prefersDark
        : query === '(prefers-reduced-motion: reduce)'
          ? prefersReducedMotion
          : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useTheme', () => {
  beforeEach(() => {
    // Reset store to default state
    useUIStore.setState({
      theme: 'system',
      resolvedTheme: 'light',
      activeModal: null,
      modalProps: {},
      toasts: [],
    });
    // Reset DOM classes
    document.documentElement.classList.remove('dark', 'high-contrast');
    // Default mock: light mode, no reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMockMatchMedia(false, false),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return current theme from store', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
  });

  it('should resolve system theme to light when system prefers light', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMockMatchMedia(false, false),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('should resolve system theme to dark when system prefers dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMockMatchMedia(true, false),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should set theme and update store', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('should apply dark class to DOM when theme is dark', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should apply high-contrast class to DOM when theme is high-contrast', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('high-contrast');
    });

    expect(document.documentElement.classList.contains('high-contrast')).toBe(
      true
    );
  });

  it('should remove dark class when switching to light', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle between light and dark based on resolved theme', () => {
    useUIStore.setState({ theme: 'light', resolvedTheme: 'light' });

    const { result } = renderHook(() => useTheme());

    // Start at light
    expect(result.current.resolvedTheme).toBe('light');

    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');

    // Toggle back to light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
  });
});
