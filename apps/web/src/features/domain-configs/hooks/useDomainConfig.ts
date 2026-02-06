/**
 * useDomainConfig Hook
 * TanStack Query hook for fetching a single domain config.
 */

import { useQuery } from '@tanstack/react-query';
import {
  domainConfigsService,
  type DomainConfig,
} from '../api/domain-configs.service';
import { queryKeys } from '@/shared/services/query-keys';

interface UseDomainConfigOptions {
  enabled?: boolean;
}

interface UseDomainConfigReturn {
  config: DomainConfig | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDomainConfig(
  id: string | undefined,
  options: UseDomainConfigOptions = {}
): UseDomainConfigReturn {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: queryKeys.domainConfigs.detail(id ?? ''),
    queryFn: () => domainConfigsService.get(id!),
    enabled: enabled && !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
}
