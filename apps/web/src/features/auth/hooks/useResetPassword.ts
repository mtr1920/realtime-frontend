/**
 * useResetPassword Hook
 * Hook for resetting password with a token.
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { authService } from '@/features/auth/api/auth.service';

interface UseResetPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

interface UseResetPasswordReturn {
  resetPassword: (token: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  reset: () => void;
}

export function useResetPassword(
  options: UseResetPasswordOptions = {}
): UseResetPasswordReturn {
  const { onSuccess, onError, redirectTo = '/login' } = options;
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async ({
      token,
      password,
    }: {
      token: string;
      password: string;
    }) => {
      return authService.resetPassword(token, password);
    },
    onSuccess: () => {
      onSuccess?.();
      navigate({ to: redirectTo });
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const resetPassword = useCallback(
    async (token: string, password: string): Promise<void> => {
      await mutation.mutateAsync({ token, password });
    },
    [mutation]
  );

  return {
    resetPassword,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
