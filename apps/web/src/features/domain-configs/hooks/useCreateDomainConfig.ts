/**
 * useCreateDomainConfig Hook
 * TanStack Query mutation hook for creating a new domain config.
 */

import { useMutationWithToast } from '@/shared/hooks';
import {
  domainConfigsService,
  type DomainConfig,
  type CreateDomainConfigInput,
} from '../api/domain-configs.service';

interface UseCreateDomainConfigOptions {
  onSuccess?: (config: DomainConfig) => void;
  onError?: (error: Error) => void;
}

export function useCreateDomainConfig(options: UseCreateDomainConfigOptions = {}) {
  const { onSuccess, onError } = options;

  const mutation = useMutationWithToast({
    mutationFn: (data: CreateDomainConfigInput) => domainConfigsService.create(data),
    toast: { successMessage: 'Domain configuration created successfully' },
    invalidateKeys: [['domain-configs']],
    onSuccess,
    onError,
  });

  return {
    createConfig: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
