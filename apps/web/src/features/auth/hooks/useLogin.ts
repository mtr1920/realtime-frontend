/**
 * useLogin Hook
 * Hook for handling login with navigation and callbacks.
 * Delegates to AuthContext for actual login logic.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthContext } from '@/features/auth/model/auth.context';
import type { LoginCredentials } from '@/features/auth/api/auth.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseLoginOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useLogin(options: UseLoginOptions = {}): UseLoginReturn {
  const { onSuccess, onError, redirectTo } = options;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuthContext();

  const mutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await auth.login(
        credentials.email,
        credentials.password,
        credentials.tenantId
      );

      if (!result.success) {
        throw new Error(result.error ?? 'Login failed');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });

      // Call success callback
      onSuccess?.();

      // Navigate to redirect URL or default
      if (redirectTo) {
        navigate({ to: redirectTo });
      }
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      await mutation.mutateAsync(credentials);
    },
    [mutation]
  );

  return {
    login,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
