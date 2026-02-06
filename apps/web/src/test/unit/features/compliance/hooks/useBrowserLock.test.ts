/**
 * useBrowserLock Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrowserLock } from '@/features/compliance/hooks/useBrowserLock';

// Mock the realtime feature
const mockSend = vi.fn();
vi.mock('@/features/realtime', () => ({
  useSend: () => mockSend,
}));

describe('useBrowserLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset document.hidden
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not attach listeners when disabled', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useBrowserLock({ enabled: false }));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(windowAddEventListenerSpy).not.toHaveBeenCalledWith(
      'blur',
      expect.any(Function)
    );
  });

  it('should attach listeners when enabled', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useBrowserLock({ enabled: true }));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
      'blur',
      expect.any(Function)
    );
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should remove listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useBrowserLock({ enabled: true }));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
      'blur',
      expect.any(Function)
    );
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should report tab_switch violation on visibility change', () => {
    renderHook(() => useBrowserLock({ enabled: true }));

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockSend).toHaveBeenCalledWith('compliance.violation', {
      type: 'tab_switch',
      severity: 'medium',
      details: expect.objectContaining({ visibilityState: 'hidden' }),
      timestamp: expect.any(String),
    });
  });

  it('should report window_blur violation on window blur when not hidden', () => {
    renderHook(() => useBrowserLock({ enabled: true }));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(mockSend).toHaveBeenCalledWith('compliance.violation', {
      type: 'window_blur',
      severity: 'low',
      details: expect.objectContaining({ timestamp: expect.any(Number) }),
      timestamp: expect.any(String),
    });
  });

  it('should not report window_blur when document is hidden', () => {
    renderHook(() => useBrowserLock({ enabled: true }));

    // Document is hidden (tab switch already handled)
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should debounce rapid violations', () => {
    renderHook(() => useBrowserLock({ enabled: true }));

    // First violation
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(mockSend).toHaveBeenCalledTimes(1);

    // Rapid second violation (within 500ms)
    act(() => {
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event('blur'));
    });

    // Should still be 1 due to debouncing
    expect(mockSend).toHaveBeenCalledTimes(1);

    // After debounce period
    act(() => {
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new Event('blur'));
    });

    // Now should be 2
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it('should provide reportViolation for manual reporting', () => {
    const { result } = renderHook(() => useBrowserLock({ enabled: true }));

    act(() => {
      result.current.reportViolation(
        'copy_paste',
        'medium',
        'Copy operation detected',
        { key: 'Ctrl+C' }
      );
    });

    expect(mockSend).toHaveBeenCalledWith('compliance.violation', {
      type: 'copy_paste',
      severity: 'medium',
      details: { key: 'Ctrl+C' },
      timestamp: expect.any(String),
    });
  });

  it('should include timestamp in violation payload', () => {
    const mockDate = new Date('2024-01-15T10:00:00Z');
    vi.setSystemTime(mockDate);

    renderHook(() => useBrowserLock({ enabled: true }));

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(mockSend).toHaveBeenCalledWith('compliance.violation', {
      type: 'window_blur',
      severity: 'low',
      details: expect.any(Object),
      timestamp: '2024-01-15T10:00:00.000Z',
    });
  });
});
