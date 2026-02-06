/**
 * useStartSession Hook
 * TanStack Query mutation hook for starting a session (CREATED → WAITING).
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { sessionsService, type Session } from '../api/sessions.service';

interface UseStartSessionOptions {
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
}

export function useStartSession(options: UseStartSessionOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutationWithToast({
    mutationFn: (sessionId: string) => sessionsService.start(sessionId),
    toast: { successMessage: 'Session started successfully' },
    invalidateKeys: [queryKeys.sessions.root],
    onCacheUpdate: (session) => {
      // Update the specific session in cache
      queryClient.setQueryData(queryKeys.sessions.detail(session.id), session);
    },
    onSuccess,
    onError,
  });

  return {
    startSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
