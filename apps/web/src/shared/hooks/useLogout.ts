/**
 * useLogout Hook
 *
 * Hook for handling logout with navigation and callbacks.
 * Located in shared/ because it's used by navigation components.
 * Delegates to AuthContext for actual logout logic.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/shared/model/auth.context';

interface UseLogoutOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useLogout(options: UseLogoutOptions = {}): UseLogoutReturn {
  const { onSuccess, onError, redirectTo = '/login' } = options;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuthContext();

  const mutation = useMutation({
    mutationFn: async () => {
      await auth.logout();
    },
    onSuccess: () => {
      // Clear all queries (user may have switched accounts)
      queryClient.clear();

      // Call success callback
      onSuccess?.();

      // Navigate to login
      navigate({ to: redirectTo });
    },
    onError: (error: Error) => {
      // Clear queries even on error
      queryClient.clear();

      onError?.(error);

      // Still navigate to login
      navigate({ to: redirectTo });
    },
  });

  const logout = useCallback(async (): Promise<void> => {
    await mutation.mutateAsync();
  }, [mutation]);

  return {
    logout,
    isLoading: mutation.isPending,
  };
}
