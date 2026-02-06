/**
 * useDeleteDomainConfig Hook
 * TanStack Query mutation hook for deleting a domain config.
 */

import { useMutationWithToast } from '@/shared/hooks';
import { domainConfigsService } from '../api/domain-configs.service';

interface UseDeleteDomainConfigOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteDomainConfig(options: UseDeleteDomainConfigOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (id: string) => domainConfigsService.delete(id),
    toast: { successMessage: 'Domain configuration deleted successfully' },
    invalidateKeys: [['domain-configs']],
    onSuccess,
    onError,
  });

  return {
    deleteConfig: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
