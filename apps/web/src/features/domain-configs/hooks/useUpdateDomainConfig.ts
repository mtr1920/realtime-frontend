/**
 * useUpdateDomainConfig Hook
 * TanStack Query mutation hook for updating an existing domain config.
 */

import { useMutationWithToast } from '@/shared/hooks';
import {
  domainConfigsService,
  type DomainConfig,
  type UpdateDomainConfigInput,
} from '../api/domain-configs.service';

interface UseUpdateDomainConfigOptions {
  onSuccess?: (config: DomainConfig) => void;
  onError?: (error: Error) => void;
}

interface UpdateDomainConfigVariables {
  id: string;
  data: UpdateDomainConfigInput;
}

export function useUpdateDomainConfig(options: UseUpdateDomainConfigOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: ({ id, data }: UpdateDomainConfigVariables) =>
      domainConfigsService.update(id, data),
    toast: { successMessage: 'Domain configuration updated successfully' },
    invalidateKeys: [['domain-configs']],
    onSuccess,
    onError,
  });

  return {
    updateConfig: (id: string, data: UpdateDomainConfigInput) =>
      mutation.mutateAsync({ id, data }),
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
