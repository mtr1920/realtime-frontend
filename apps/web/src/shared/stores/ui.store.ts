import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Theme, ResolvedTheme } from '@/types';

// Toast is UI-specific, kept local
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface UIState {
  // Theme
  theme: Theme;
  resolvedTheme: ResolvedTheme;

  // Page title (shown in header)
  pageTitle: string;

  // Modals
  activeModal: string | null;
  modalProps: Record<string, unknown>;

  // Toasts
  toasts: Toast[];

  // Actions
  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: ResolvedTheme) => void;
  setPageTitle: (title: string) => void;
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // Initial state
        theme: 'system',
        resolvedTheme: 'light',
        pageTitle: '',
        activeModal: null,
        modalProps: {},
        toasts: [],

        // Actions
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),

        setResolvedTheme: (resolvedTheme) =>
          set((state) => {
            state.resolvedTheme = resolvedTheme;
          }),

        setPageTitle: (title) =>
          set((state) => {
            state.pageTitle = title;
          }),

        openModal: (modalId, props = {}) =>
          set((state) => {
            state.activeModal = modalId;
            state.modalProps = props;
          }),

        closeModal: () =>
          set((state) => {
            state.activeModal = null;
            state.modalProps = {};
          }),

        addToast: (toast) =>
          set((state) => {
            const id = crypto.randomUUID();
            state.toasts.push({ ...toast, id });
          }),

        removeToast: (id) =>
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== id);
          }),

        clearToasts: () =>
          set((state) => {
            state.toasts = [];
          }),
      })),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          resolvedTheme: state.resolvedTheme,
        }),
      }
    )
  )
);
