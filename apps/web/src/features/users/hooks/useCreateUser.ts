/**
 * useCreateUser Hook
 * TanStack Query mutation hook for creating a new user.
 */

import { useMutationWithToast } from '@/shared/hooks';
import { usersService, type User, type CreateUserInput } from '../api/users.service';

interface UseCreateUserOptions {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
}

export function useCreateUser(options: UseCreateUserOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (data: CreateUserInput) => usersService.create(data),
    toast: { successMessage: 'User created successfully' },
    invalidateKeys: [['users']],
    onSuccess,
    onError,
  });

  return {
    createUser: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
