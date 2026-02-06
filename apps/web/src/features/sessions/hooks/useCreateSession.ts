/**
 * useCreateSession Hook
 * TanStack Query mutation hook for creating a new session.
 */

import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { sessionsService, type Session, type CreateSessionInput } from '../api/sessions.service';

interface UseCreateSessionOptions {
  onSuccess?: (session: Session) => void;
  onError?: (error: Error) => void;
}

export function useCreateSession(options: UseCreateSessionOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (data: CreateSessionInput) => sessionsService.create(data),
    toast: { successMessage: 'Session created successfully' },
    invalidateKeys: [queryKeys.sessions.root],
    onSuccess,
    onError,
  });

  return {
    createSession: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
