/**
 * Utility Functions Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatRelativeTime,
  sleep,
  generateId,
  isBrowser,
  getStorageItem,
  setStorageItem,
} from '@/shared/lib/utils';

describe('utils', () => {
  // ===========================================================================
  // cn (className merge)
  // ===========================================================================

  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const showBar = true;
      const showBaz = false;
      const result = cn('foo', showBar && 'bar', showBaz && 'baz');
      expect(result).toBe('foo bar');
    });

    it('should merge Tailwind classes with proper precedence', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['foo', 'bar'], 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('should handle objects for conditional classes', () => {
      const result = cn({ foo: true, bar: false, baz: true });
      expect(result).toBe('foo baz');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toBe('foo bar');
    });
  });

  // ===========================================================================
  // formatRelativeTime
  // ===========================================================================

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for times less than 60 seconds ago', () => {
      const date = new Date('2024-01-15T11:59:30Z');
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('should return minutes ago for times less than 60 minutes ago', () => {
      const date = new Date('2024-01-15T11:45:00Z');
      expect(formatRelativeTime(date)).toBe('15m ago');
    });

    it('should return hours ago for times less than 24 hours ago', () => {
      const date = new Date('2024-01-15T09:00:00Z');
      expect(formatRelativeTime(date)).toBe('3h ago');
    });

    it('should return days ago for times less than 7 days ago', () => {
      const date = new Date('2024-01-13T12:00:00Z');
      expect(formatRelativeTime(date)).toBe('2d ago');
    });

    it('should return formatted date for times more than 7 days ago', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = formatRelativeTime(date);
      // Result format depends on locale, just check it's not a relative format
      expect(result).not.toContain('ago');
      expect(result).not.toBe('just now');
    });

    it('should accept string dates', () => {
      const result = formatRelativeTime('2024-01-15T11:59:30Z');
      expect(result).toBe('just now');
    });
  });

  // ===========================================================================
  // sleep
  // ===========================================================================

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified milliseconds', async () => {
      const callback = vi.fn();

      const promise = sleep(1000).then(callback);
      expect(callback).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(999);
      expect(callback).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(callback).toHaveBeenCalled();
    });

    it('should resolve immediately for 0ms', async () => {
      const callback = vi.fn();
      const promise = sleep(0).then(callback);

      await vi.advanceTimersByTimeAsync(0);
      await promise;
      expect(callback).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // generateId
  // ===========================================================================

  describe('generateId', () => {
    it('should generate a random ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should add prefix when provided', () => {
      const id = generateId('user');
      expect(id.startsWith('user_')).toBe(true);
    });

    it('should generate IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();

      // Without prefix, should be 7 characters (random part)
      expect(id1.length).toBe(7);
      expect(id2.length).toBe(7);
    });

    it('should handle empty prefix', () => {
      const id = generateId('');
      // Empty prefix means no underscore
      expect(id).not.toContain('_');
    });
  });

  // ===========================================================================
  // isBrowser
  // ===========================================================================

  describe('isBrowser', () => {
    it('should return true when window is defined', () => {
      expect(isBrowser()).toBe(true);
    });

    it('should return false when window is undefined', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - testing undefined window
      delete globalThis.window;

      expect(isBrowser()).toBe(false);

      globalThis.window = originalWindow;
    });
  });

  // ===========================================================================
  // getStorageItem
  // ===========================================================================

  describe('getStorageItem', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should return stored value', () => {
      localStorage.setItem('test', JSON.stringify({ foo: 'bar' }));
      const result = getStorageItem('test', null);
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return fallback when key does not exist', () => {
      const result = getStorageItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return fallback when JSON parse fails', () => {
      localStorage.setItem('invalid', 'not valid json');
      const result = getStorageItem('invalid', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should handle primitive values', () => {
      localStorage.setItem('number', JSON.stringify(42));
      localStorage.setItem('boolean', JSON.stringify(true));
      localStorage.setItem('string', JSON.stringify('hello'));

      expect(getStorageItem('number', 0)).toBe(42);
      expect(getStorageItem('boolean', false)).toBe(true);
      expect(getStorageItem('string', '')).toBe('hello');
    });

    it('should handle arrays', () => {
      localStorage.setItem('array', JSON.stringify([1, 2, 3]));
      expect(getStorageItem('array', [])).toEqual([1, 2, 3]);
    });

    it('should return fallback when not in browser', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - testing undefined window
      delete globalThis.window;

      const result = getStorageItem('test', 'fallback');
      expect(result).toBe('fallback');

      globalThis.window = originalWindow;
    });
  });

  // ===========================================================================
  // setStorageItem
  // ===========================================================================

  describe('setStorageItem', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should store value in localStorage', () => {
      setStorageItem('test', { foo: 'bar' });
      expect(localStorage.getItem('test')).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('should handle primitive values', () => {
      setStorageItem('number', 42);
      setStorageItem('boolean', true);
      setStorageItem('string', 'hello');

      expect(localStorage.getItem('number')).toBe('42');
      expect(localStorage.getItem('boolean')).toBe('true');
      expect(localStorage.getItem('string')).toBe('"hello"');
    });

    it('should handle arrays', () => {
      setStorageItem('array', [1, 2, 3]);
      expect(localStorage.getItem('array')).toBe('[1,2,3]');
    });

    it('should not throw when localStorage is full', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => setStorageItem('test', 'value')).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should do nothing when not in browser', () => {
      const originalWindow = globalThis.window;
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // @ts-expect-error - testing undefined window
      delete globalThis.window;

      setStorageItem('test', 'value');
      expect(setItemSpy).not.toHaveBeenCalled();

      globalThis.window = originalWindow;
      setItemSpy.mockRestore();
    });
  });
});
