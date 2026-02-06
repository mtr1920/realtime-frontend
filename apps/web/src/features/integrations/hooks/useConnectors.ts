/**
 * useConnectors Hook
 * Fetches paginated connectors with filters.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';
import type { ConnectorListParams } from '../types/integrations.types';

export function useConnectors(params?: ConnectorListParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.integrations.all(params as Record<string, unknown>),
    queryFn: () => integrationsService.list(params),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.integrations.root });
  };

  return {
    connectors: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
