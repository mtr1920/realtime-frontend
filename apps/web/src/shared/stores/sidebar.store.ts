/**
 * Sidebar Store
 * Manages sidebar state (collapsed, mobile open).
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set) => ({
          isCollapsed: false,
          isMobileOpen: false,
          setCollapsed: (collapsed) =>
            set((state) => {
              state.isCollapsed = collapsed;
            }),
          toggleCollapsed: () =>
            set((state) => {
              state.isCollapsed = !state.isCollapsed;
            }),
          setMobileOpen: (open) =>
            set((state) => {
              state.isMobileOpen = open;
            }),
          toggleMobileOpen: () =>
            set((state) => {
              state.isMobileOpen = !state.isMobileOpen;
            }),
        }),
        {
          name: 'sidebar-storage',
          partialize: (state) => ({ isCollapsed: state.isCollapsed }),
        }
      )
    )
  )
);
