/**
 * useCompleteSession Hook
 * TanStack Query mutation hook for completing a session.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { sessionsService, type Session } from '../api/sessions.service';

interface UseCompleteSessionOptions {
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
}

export function useCompleteSession(options: UseCompleteSessionOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutationWithToast({
    mutationFn: (sessionId: string) => sessionsService.complete(sessionId),
    toast: { successMessage: 'Session completed successfully' },
    invalidateKeys: [queryKeys.sessions.root],
    onCacheUpdate: (session) => {
      // Update the specific session in cache
      queryClient.setQueryData(queryKeys.sessions.detail(session.id), session);
    },
    onSuccess,
    onError,
  });

  return {
    completeSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
