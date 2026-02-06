/**
 * useAuth Hook
 * Main authentication hook that provides all auth functionality.
 * Re-exports from AuthContext for convenience.
 */

export { useAuthContext as useAuth } from '@/features/auth/model/auth.context';
export type { AuthContextValue } from '@/features/auth/model/auth.context';
