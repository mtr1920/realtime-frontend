/**
 * Sidebar Store Tests
 * Tests for the sidebar state management store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSidebarStore } from '@/shared/stores/sidebar.store';

describe('useSidebarStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useSidebarStore.setState({
        isCollapsed: false,
        isMobileOpen: false,
      });
    });
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useSidebarStore.getState();

      expect(state.isCollapsed).toBe(false);
      expect(state.isMobileOpen).toBe(false);
    });
  });

  // ===========================================================================
  // Collapsed State
  // ===========================================================================

  describe('collapsed state', () => {
    it('should set collapsed to true', () => {
      act(() => {
        useSidebarStore.getState().setCollapsed(true);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it('should set collapsed to false', () => {
      act(() => {
        useSidebarStore.getState().setCollapsed(true);
        useSidebarStore.getState().setCollapsed(false);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });

    it('should toggle collapsed from false to true', () => {
      expect(useSidebarStore.getState().isCollapsed).toBe(false);

      act(() => {
        useSidebarStore.getState().toggleCollapsed();
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });

    it('should toggle collapsed from true to false', () => {
      act(() => {
        useSidebarStore.getState().setCollapsed(true);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);

      act(() => {
        useSidebarStore.getState().toggleCollapsed();
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(false);
    });

    it('should toggle collapsed multiple times', () => {
      act(() => {
        useSidebarStore.getState().toggleCollapsed();
        useSidebarStore.getState().toggleCollapsed();
        useSidebarStore.getState().toggleCollapsed();
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
    });
  });

  // ===========================================================================
  // Mobile Open State
  // ===========================================================================

  describe('mobile open state', () => {
    it('should set mobile open to true', () => {
      act(() => {
        useSidebarStore.getState().setMobileOpen(true);
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });

    it('should set mobile open to false', () => {
      act(() => {
        useSidebarStore.getState().setMobileOpen(true);
        useSidebarStore.getState().setMobileOpen(false);
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it('should toggle mobile open from false to true', () => {
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);

      act(() => {
        useSidebarStore.getState().toggleMobileOpen();
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });

    it('should toggle mobile open from true to false', () => {
      act(() => {
        useSidebarStore.getState().setMobileOpen(true);
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(true);

      act(() => {
        useSidebarStore.getState().toggleMobileOpen();
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(false);
    });

    it('should toggle mobile open multiple times', () => {
      act(() => {
        useSidebarStore.getState().toggleMobileOpen();
        useSidebarStore.getState().toggleMobileOpen();
        useSidebarStore.getState().toggleMobileOpen();
      });

      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });
  });

  // ===========================================================================
  // Independent State
  // ===========================================================================

  describe('independent state', () => {
    it('should allow collapsed and mobile open to be independent', () => {
      // Set collapsed true, mobile open false
      act(() => {
        useSidebarStore.getState().setCollapsed(true);
        useSidebarStore.getState().setMobileOpen(false);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);

      // Set collapsed false, mobile open true
      act(() => {
        useSidebarStore.getState().setCollapsed(false);
        useSidebarStore.getState().setMobileOpen(true);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(false);
      expect(useSidebarStore.getState().isMobileOpen).toBe(true);

      // Both true
      act(() => {
        useSidebarStore.getState().setCollapsed(true);
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });

    it('should toggle states independently', () => {
      act(() => {
        useSidebarStore.getState().toggleCollapsed();
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
      expect(useSidebarStore.getState().isMobileOpen).toBe(false);

      act(() => {
        useSidebarStore.getState().toggleMobileOpen();
      });

      expect(useSidebarStore.getState().isCollapsed).toBe(true);
      expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    });
  });
});
