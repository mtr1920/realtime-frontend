/**
 * useDeleteUser Hook
 * TanStack Query mutation hook for deleting a user.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { usersService } from '../api/users.service';

interface UseDeleteUserOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteUser(options: UseDeleteUserOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutationWithToast({
    mutationFn: (userId: string) => usersService.delete(userId),
    toast: { successMessage: 'User removed successfully' },
    invalidateKeys: [['users']],
    onCacheUpdate: (_data, userId) => {
      // Remove the user from detail cache
      queryClient.removeQueries({
        queryKey: queryKeys.users.detail(userId),
      });
    },
    onSuccess: () => {
      onSuccess?.();
    },
    onError,
  });

  return {
    deleteUser: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
