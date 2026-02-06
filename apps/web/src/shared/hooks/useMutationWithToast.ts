/**
 * useMutationWithToast Hook
 * Reusable wrapper for TanStack Query mutations with built-in toast notifications.
 */

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';
import { handleError, showSuccess } from '@/shared/errors';

interface ToastOptions {
  /** Success message to show on successful mutation */
  successMessage?: string;
  /** Override error message (otherwise uses error code mapping) */
  errorMessage?: string;
  /** If true, don't show error toast */
  silentError?: boolean;
}

interface UseMutationWithToastOptions<TData, TError, TVariables, TContext> {
  /** The mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Toast configuration */
  toast?: ToastOptions;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Additional cache updates on success */
  onCacheUpdate?: (data: TData, variables: TVariables) => void;
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** Callback on error */
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  /** Callback on settled (success or error) */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
}

interface UseMutationWithToastReturn<TData, TError, TVariables> {
  /** The mutation function */
  mutate: (variables: TVariables) => void;
  /** The async mutation function */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Whether the mutation is pending */
  isPending: boolean;
  /** Whether the mutation was successful */
  isSuccess: boolean;
  /** Whether the mutation errored */
  isError: boolean;
  /** The error if mutation failed */
  error: TError | null;
  /** The data returned from mutation */
  data: TData | undefined;
  /** Reset the mutation state */
  reset: () => void;
}

/**
 * A reusable mutation hook that handles:
 * - Success/error toast notifications
 * - Query cache invalidation
 * - Error reporting
 *
 * @example
 * ```ts
 * const { mutateAsync, isPending } = useMutationWithToast({
 *   mutationFn: (data) => api.createWorkspace(data),
 *   toast: { successMessage: 'Workspace created' },
 *   invalidateKeys: [queryKeys.workspaces.root],
 * });
 * ```
 */
export function useMutationWithToast<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>({
  mutationFn,
  toast: toastOptions,
  invalidateKeys,
  onCacheUpdate,
  onSuccess,
  onError,
  onSettled,
}: UseMutationWithToastOptions<TData, TError, TVariables, TContext>): UseMutationWithToastReturn<
  TData,
  TError,
  TVariables
> {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    meta: {
      skipGlobalErrorHandler: true, // We handle errors locally
    },
    onSuccess: (data, variables, context) => {
      // Show success toast
      if (toastOptions?.successMessage) {
        showSuccess(toastOptions.successMessage);
      }

      // Invalidate query caches
      if (invalidateKeys?.length) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Run additional cache updates
      onCacheUpdate?.(data, variables);

      // Call user's onSuccess
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Show error toast unless silent
      if (!toastOptions?.silentError) {
        handleError(error, {
          message: toastOptions?.errorMessage,
        });
      }

      // Call user's onError
      onError?.(error, variables, context);
    },
    onSettled,
  });

  // Stable wrapper function
  const mutate = useCallback(
    (variables: TVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  const mutateAsync = useCallback(
    (variables: TVariables) => {
      return mutation.mutateAsync(variables);
    },
    [mutation]
  );

  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
