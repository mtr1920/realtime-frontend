/**
 * useForgotPassword Hook
 * Hook for requesting password reset emails.
 */

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { authService } from '@/features/auth/api/auth.service';

interface UseForgotPasswordOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface ForgotPasswordInput {
  email: string;
  tenantId: string;
}

interface UseForgotPasswordReturn {
  forgotPassword: (input: ForgotPasswordInput) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  reset: () => void;
}

export function useForgotPassword(
  options: UseForgotPasswordOptions = {}
): UseForgotPasswordReturn {
  const { onSuccess, onError } = options;

  const mutation = useMutation({
    mutationFn: async (input: ForgotPasswordInput) => {
      return authService.forgotPassword(input.email, input.tenantId);
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const forgotPassword = useCallback(
    async (input: ForgotPasswordInput): Promise<void> => {
      await mutation.mutateAsync(input);
    },
    [mutation]
  );

  return {
    forgotPassword,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
