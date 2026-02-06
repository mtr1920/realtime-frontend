/**
 * useCreateWorkspace Hook
 * TanStack Query mutation hook for creating a new workspace.
 */

import { useMutationWithToast } from '@/shared/hooks';
import { queryKeys } from '@/shared/services/query-keys';
import {
  workspacesService,
  type Workspace,
  type CreateWorkspaceInput,
} from '../api/workspaces.service';

interface UseCreateWorkspaceOptions {
  onSuccess?: (workspace: Workspace) => void;
  onError?: (error: Error) => void;
}

export function useCreateWorkspace(options: UseCreateWorkspaceOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (data: CreateWorkspaceInput) => workspacesService.create(data),
    toast: { successMessage: 'Workspace created successfully' },
    invalidateKeys: [queryKeys.workspaces.root],
    onSuccess,
    onError,
  });

  return {
    createWorkspace: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
