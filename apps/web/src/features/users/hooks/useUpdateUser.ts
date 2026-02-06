/**
 * useUpdateUser Hook
 * TanStack Query mutation hook for updating an existing user.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { usersService, type User, type UpdateUserInput } from '../api/users.service';

interface UpdateUserVariables {
  id: string;
  data: UpdateUserInput;
}

interface UseUpdateUserOptions {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
}

export function useUpdateUser(options: UseUpdateUserOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutationWithToast({
    mutationFn: ({ id, data }: UpdateUserVariables) => usersService.update(id, data),
    toast: { successMessage: 'User updated successfully' },
    invalidateKeys: [['users']],
    onCacheUpdate: (user) => {
      // Also update the detail cache
      queryClient.setQueryData(queryKeys.users.detail(user.id), user);
    },
    onSuccess,
    onError,
  });

  return {
    updateUser: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
