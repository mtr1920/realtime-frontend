/**
 * Auth Context
 * Provides authentication state and actions to children.
 */

import { createContext, useContext } from 'react';
import type { User, UserRole } from '@/types';

export interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (
    email: string,
    password: string,
    tenantId: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;

  // Helpers
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  getTenantId: () => string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
