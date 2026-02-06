/**
 * useConnector Hook
 * Fetches a single connector by ID.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';

export function useConnector(connectorId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.integrations.detail(connectorId ?? ''),
    queryFn: () => integrationsService.getById(connectorId!),
    enabled: !!connectorId,
  });

  const invalidate = () => {
    if (connectorId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.detail(connectorId),
      });
    }
  };

  return {
    connector: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
