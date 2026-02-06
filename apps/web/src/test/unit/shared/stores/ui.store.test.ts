/**
 * UI Store Tests
 * Tests for the UI state management store.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUIStore } from '@/shared/stores/ui.store';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useUIStore.setState({
        theme: 'system',
        resolvedTheme: 'light',
        activeModal: null,
        modalProps: {},
        toasts: [],
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useUIStore.getState();

      expect(state.theme).toBe('system');
      expect(state.resolvedTheme).toBe('light');
      expect(state.activeModal).toBeNull();
      expect(state.modalProps).toEqual({});
      expect(state.toasts).toEqual([]);
    });
  });

  // ===========================================================================
  // Theme
  // ===========================================================================

  describe('theme', () => {
    it('should set theme to light', () => {
      act(() => {
        useUIStore.getState().setTheme('light');
      });

      expect(useUIStore.getState().theme).toBe('light');
    });

    it('should set theme to dark', () => {
      act(() => {
        useUIStore.getState().setTheme('dark');
      });

      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should set theme to system', () => {
      act(() => {
        useUIStore.getState().setTheme('dark');
        useUIStore.getState().setTheme('system');
      });

      expect(useUIStore.getState().theme).toBe('system');
    });

    it('should set resolved theme', () => {
      act(() => {
        useUIStore.getState().setResolvedTheme('dark');
      });

      expect(useUIStore.getState().resolvedTheme).toBe('dark');
    });
  });

  // ===========================================================================
  // Modals
  // ===========================================================================

  describe('modals', () => {
    it('should open modal with id', () => {
      act(() => {
        useUIStore.getState().openModal('confirm-delete');
      });

      expect(useUIStore.getState().activeModal).toBe('confirm-delete');
      expect(useUIStore.getState().modalProps).toEqual({});
    });

    it('should open modal with props', () => {
      act(() => {
        useUIStore.getState().openModal('edit-user', { userId: '123', name: 'Test' });
      });

      expect(useUIStore.getState().activeModal).toBe('edit-user');
      expect(useUIStore.getState().modalProps).toEqual({ userId: '123', name: 'Test' });
    });

    it('should close modal and clear props', () => {
      act(() => {
        useUIStore.getState().openModal('edit-user', { userId: '123' });
      });

      expect(useUIStore.getState().activeModal).toBe('edit-user');

      act(() => {
        useUIStore.getState().closeModal();
      });

      expect(useUIStore.getState().activeModal).toBeNull();
      expect(useUIStore.getState().modalProps).toEqual({});
    });

    it('should replace modal when opening another', () => {
      act(() => {
        useUIStore.getState().openModal('modal-1', { foo: 'bar' });
      });

      act(() => {
        useUIStore.getState().openModal('modal-2', { baz: 'qux' });
      });

      expect(useUIStore.getState().activeModal).toBe('modal-2');
      expect(useUIStore.getState().modalProps).toEqual({ baz: 'qux' });
    });
  });

  // ===========================================================================
  // Toasts
  // ===========================================================================

  describe('toasts', () => {
    // Use proper UUID format for mocks
    const mockUuid1 = '12345678-1234-1234-1234-123456789abc' as `${string}-${string}-${string}-${string}-${string}`;
    const mockUuid2 = '22345678-2234-2234-2234-223456789abc' as `${string}-${string}-${string}-${string}-${string}`;
    const mockUuid3 = '32345678-3234-3234-3234-323456789abc' as `${string}-${string}-${string}-${string}-${string}`;

    it('should add toast with generated id', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid1);

      act(() => {
        useUIStore.getState().addToast({
          title: 'Success',
          description: 'Operation completed',
          variant: 'success',
        });
      });

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toEqual({
        id: mockUuid1,
        title: 'Success',
        description: 'Operation completed',
        variant: 'success',
      });
    });

    it('should add multiple toasts', () => {
      vi.spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce(mockUuid1)
        .mockReturnValueOnce(mockUuid2)
        .mockReturnValueOnce(mockUuid3);

      act(() => {
        useUIStore.getState().addToast({ title: 'Toast 1' });
        useUIStore.getState().addToast({ title: 'Toast 2' });
        useUIStore.getState().addToast({ title: 'Toast 3' });
      });

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(3);
      expect(toasts[0]?.title).toBe('Toast 1');
      expect(toasts[1]?.title).toBe('Toast 2');
      expect(toasts[2]?.title).toBe('Toast 3');
    });

    it('should remove toast by id', () => {
      vi.spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce(mockUuid1)
        .mockReturnValueOnce(mockUuid2)
        .mockReturnValueOnce(mockUuid3);

      act(() => {
        useUIStore.getState().addToast({ title: 'Toast 1' });
        useUIStore.getState().addToast({ title: 'Toast 2' });
        useUIStore.getState().addToast({ title: 'Toast 3' });
      });

      expect(useUIStore.getState().toasts).toHaveLength(3);

      act(() => {
        useUIStore.getState().removeToast(mockUuid2);
      });

      const toasts = useUIStore.getState().toasts;
      expect(toasts).toHaveLength(2);
      expect(toasts.find((t) => t.id === mockUuid2)).toBeUndefined();
      expect(toasts[0]?.id).toBe(mockUuid1);
      expect(toasts[1]?.id).toBe(mockUuid3);
    });

    it('should not crash when removing non-existent toast', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid1);

      act(() => {
        useUIStore.getState().addToast({ title: 'Toast 1' });
      });

      expect(() => {
        act(() => {
          useUIStore.getState().removeToast('non-existent');
        });
      }).not.toThrow();

      expect(useUIStore.getState().toasts).toHaveLength(1);
    });

    it('should clear all toasts', () => {
      vi.spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce(mockUuid1)
        .mockReturnValueOnce(mockUuid2);

      act(() => {
        useUIStore.getState().addToast({ title: 'Toast 1' });
        useUIStore.getState().addToast({ title: 'Toast 2' });
      });

      expect(useUIStore.getState().toasts).toHaveLength(2);

      act(() => {
        useUIStore.getState().clearToasts();
      });

      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('should add toast with all variants', () => {
      const variants = ['default', 'success', 'warning', 'error'] as const;
      const mockUuids = [
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
      ] as `${string}-${string}-${string}-${string}-${string}`[];

      variants.forEach((variant, index) => {
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuids[index]!);

        act(() => {
          useUIStore.getState().clearToasts();
          useUIStore.getState().addToast({ title: `${variant} toast`, variant });
        });

        expect(useUIStore.getState().toasts[0]?.variant).toBe(variant);
      });
    });

    it('should add toast with optional duration', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid1);

      act(() => {
        useUIStore.getState().addToast({
          title: 'Timed toast',
          duration: 5000,
        });
      });

      expect(useUIStore.getState().toasts[0]?.duration).toBe(5000);
    });
  });
});
