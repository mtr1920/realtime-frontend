/**
 * useTenant Hook
 * Fetches tenant settings.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { tenantSettingsService } from '../api/tenant-settings.service';

export function useTenant(tenantId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.tenantSettings.detail(tenantId ?? ''),
    queryFn: () => tenantSettingsService.get(tenantId!),
    enabled: !!tenantId,
  });

  const invalidate = () => {
    if (tenantId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantSettings.detail(tenantId),
      });
    }
  };

  return {
    tenant: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
