/**
 * useUpdateWorkspace Hook
 * TanStack Query mutation hook for updating a workspace.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import {
  workspacesService,
  type Workspace,
  type UpdateWorkspaceInput,
} from '../api/workspaces.service';

interface UseUpdateWorkspaceOptions {
  onSuccess?: (workspace: Workspace) => void;
  onError?: (error: Error) => void;
}

interface UpdateWorkspaceParams {
  id: string;
  data: UpdateWorkspaceInput;
}

export function useUpdateWorkspace(options: UseUpdateWorkspaceOptions = {}) {
  const { onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const mutation = useMutationWithToast({
    mutationFn: ({ id, data }: UpdateWorkspaceParams) => workspacesService.update(id, data),
    toast: { successMessage: 'Workspace updated successfully' },
    invalidateKeys: [queryKeys.workspaces.root],
    onCacheUpdate: (workspace) => {
      // Update the specific workspace in cache
      queryClient.setQueryData(queryKeys.workspaces.detail(workspace.id), workspace);
    },
    onSuccess,
    onError,
  });

  return {
    updateWorkspace: (id: string, data: UpdateWorkspaceInput) =>
      mutation.mutateAsync({ id, data }),
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
