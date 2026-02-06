/**
 * useShareLinks Hook
 * TanStack Query hooks for share link CRUD operations.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import {
  sessionsService,
  type ShareLink,
  type CreateShareLinkInput,
  type UpdateShareLinkInput,
} from '../api/sessions.service';

// =============================================================================
// Query Hook
// =============================================================================

interface UseShareLinksOptions {
  enabled?: boolean;
}

interface UseShareLinksReturn {
  shareLinks: ShareLink[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export function useShareLinks(
  sessionId: string,
  options: UseShareLinksOptions = {}
): UseShareLinksReturn {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.sessions.shareLinks(sessionId),
    queryFn: ({ signal }) => sessionsService.listShareLinks(sessionId, { signal }),
    enabled: enabled && !!sessionId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  const invalidate = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.sessions.shareLinks(sessionId),
    });
  }, [queryClient, sessionId]);

  return {
    shareLinks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch,
    invalidate,
  };
}

// =============================================================================
// Mutation Hooks
// =============================================================================

interface UseCreateShareLinkOptions {
  onSuccess?: (shareLink: ShareLink) => void;
  onError?: (error: Error) => void;
}

export function useCreateShareLink(
  sessionId: string,
  options: UseCreateShareLinkOptions = {}
) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (data: CreateShareLinkInput) =>
      sessionsService.createShareLink(sessionId, data),
    toast: { successMessage: 'Share link created' },
    invalidateKeys: [queryKeys.sessions.shareLinks(sessionId)],
    onSuccess,
    onError,
  });

  return {
    createShareLink: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

interface UseUpdateShareLinkOptions {
  onSuccess?: (shareLink: ShareLink) => void;
  onError?: (error: Error) => void;
}

export function useUpdateShareLink(
  sessionId: string,
  options: UseUpdateShareLinkOptions = {}
) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: ({ shareId, data }: { shareId: string; data: UpdateShareLinkInput }) =>
      sessionsService.updateShareLink(sessionId, shareId, data),
    toast: { successMessage: 'Share link updated' },
    invalidateKeys: [queryKeys.sessions.shareLinks(sessionId)],
    onSuccess,
    onError,
  });

  return {
    updateShareLink: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

interface UseDeleteShareLinkOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteShareLink(
  sessionId: string,
  options: UseDeleteShareLinkOptions = {}
) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (shareId: string) =>
      sessionsService.deleteShareLink(sessionId, shareId),
    toast: { successMessage: 'Share link deleted' },
    invalidateKeys: [queryKeys.sessions.shareLinks(sessionId)],
    onSuccess,
    onError,
  });

  return {
    deleteShareLink: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
