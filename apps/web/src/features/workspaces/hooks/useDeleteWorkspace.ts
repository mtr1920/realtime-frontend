/**
 * useDeleteWorkspace Hook
 * TanStack Query mutation hook for deleting a workspace.
 */

import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import { workspacesService } from '../api/workspaces.service';

interface UseDeleteWorkspaceOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteWorkspace(options: UseDeleteWorkspaceOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (id: string) => workspacesService.delete(id),
    toast: { successMessage: 'Workspace deleted successfully' },
    invalidateKeys: [queryKeys.workspaces.root],
    onSuccess: () => onSuccess?.(),
    onError,
  });

  return {
    deleteWorkspace: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
