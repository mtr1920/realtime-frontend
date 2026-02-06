/**
 * useSyncHistory Hook
 * Fetches sync history for a connector.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { integrationsService } from '../api/integrations.service';
import type { SyncListParams } from '../types/integrations.types';

export function useSyncHistory(connectorId: string | null, params?: SyncListParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.integrations.syncs(
      connectorId ?? '',
      params as Record<string, unknown>
    ),
    queryFn: () => integrationsService.listSyncs(connectorId!, params),
    enabled: !!connectorId,
  });

  const invalidate = () => {
    if (connectorId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.integrations.syncs(connectorId),
      });
    }
  };

  return {
    syncs: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
