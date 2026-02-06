/**
 * AppShell Context
 *
 * Provides shared state for AppShell components.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface AppShellContextValue {
  /** Whether sidebar is open (on mobile) */
  sidebarOpen: boolean;
  /** Toggle sidebar */
  toggleSidebar: () => void;
  /** Set sidebar open state */
  setSidebarOpen: (open: boolean) => void;
  /** Whether sidebar is collapsed (on desktop) */
  sidebarCollapsed: boolean;
  /** Toggle sidebar collapsed */
  toggleSidebarCollapsed: () => void;
  /** Set sidebar collapsed state */
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const AppShellContext = createContext<AppShellContextValue | undefined>(
  undefined
);

// ============================================================================
// Provider
// ============================================================================

export interface AppShellProviderProps {
  children: ReactNode;
  /** Initial sidebar collapsed state */
  defaultCollapsed?: boolean;
}

export function AppShellProvider({
  children,
  defaultCollapsed = false,
}: AppShellProviderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AppShellContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        sidebarCollapsed,
        toggleSidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }

  return context;
}
