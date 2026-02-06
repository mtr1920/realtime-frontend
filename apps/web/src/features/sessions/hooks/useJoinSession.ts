/**
 * useJoinSession Hook
 * TanStack Query mutation hook for joining a session.
 * Includes session-specific error handling for expired/invalid sessions.
 */

import { useMutationWithToast } from '@/shared/hooks';
import {
  sessionsService,
  type JoinSessionInput,
  type SessionJoinResponse,
} from '../api/sessions.service';
import {
  isSessionSpecificError,
  getSessionErrorMessage,
  getSessionErrorType,
  type SessionErrorType,
} from '../utils/sessionErrors';

interface UseJoinSessionOptions {
  onSuccess?: (response: SessionJoinResponse) => void;
  onError?: (error: Error) => void;
  /** Called when a session-specific error occurs (expired, invalid status, etc.) */
  onSessionError?: (error: Error, errorType: SessionErrorType) => void;
}

interface JoinSessionParams {
  sessionId: string;
  data: JoinSessionInput;
}

export function useJoinSession(options: UseJoinSessionOptions = {}) {
  const { onSuccess, onError, onSessionError } = options;

  const mutation = useMutationWithToast({
    mutationFn: ({ sessionId, data }: JoinSessionParams) =>
      sessionsService.join(sessionId, data),
    toast: {
      successMessage: 'Joined session successfully',
      // Don't show generic error toast for session-specific errors
      silentError: true,
    },
    onSuccess,
    onError: (error: Error) => {
      // Check for session-specific errors first
      if (isSessionSpecificError(error)) {
        const errorType = getSessionErrorType(error);
        if (errorType && onSessionError) {
          onSessionError(error, errorType);
        }
      }
      // Always call the original onError if provided
      onError?.(error);
    },
  });

  return {
    joinSession: (sessionId: string, data: JoinSessionInput) =>
      mutation.mutateAsync({ sessionId, data }),
    isLoading: mutation.isPending,
    error: mutation.error,
    /** Get user-friendly message for the current error */
    errorMessage: mutation.error ? getSessionErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
