/**
 * useUpdateTenant Hook
 * Updates tenant settings.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/services/query-keys';
import { tenantSettingsService } from '../api/tenant-settings.service';
import type { UpdateTenantInput } from '../types/tenant-settings.types';

interface UseUpdateTenantOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useUpdateTenant(options?: UseUpdateTenantOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: UpdateTenantInput }) =>
      tenantSettingsService.update(tenantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenantSettings.detail(variables.tenantId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    updateTenant: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
