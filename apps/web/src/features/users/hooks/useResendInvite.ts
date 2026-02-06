/**
 * useResendInvite Hook
 * Mutation hook for resending invitations to pending users.
 */

import type { User } from '../api/users.service';
import { usersService } from '../api/users.service';
import { queryKeys } from '@/shared/services/query-keys';
import { useMutationWithToast } from '@/shared/hooks';

interface ResendInviteResult {
  message: string;
  user: User;
}

/**
 * Hook for resending user invitations.
 * Returns mutation functions and loading state.
 */
export function useResendInvite() {
  const mutation = useMutationWithToast<ResendInviteResult, Error, string>({
    mutationFn: (userId: string) => usersService.resendInvite(userId),
    toast: {
      successMessage: 'Invitation resent successfully',
    },
    invalidateKeys: [queryKeys.users.all()],
  });

  return {
    resendInvite: mutation.mutate,
    resendInviteAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
