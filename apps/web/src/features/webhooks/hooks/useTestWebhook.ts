/**
 * useTestWebhook Hook
 * TanStack Query mutation hook for testing webhook URLs.
 */

import { useMutation } from '@tanstack/react-query';
import { webhooksService, type TestWebhookInput, type TestWebhookResponse } from '../api/webhooks.service';

interface UseTestWebhookOptions {
  onSuccess?: (response: TestWebhookResponse) => void;
  onError?: (error: Error) => void;
}

interface UseTestWebhookReturn {
  testWebhook: (data: TestWebhookInput) => Promise<TestWebhookResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: TestWebhookResponse | undefined;
  reset: () => void;
}

export function useTestWebhook(
  options: UseTestWebhookOptions = {}
): UseTestWebhookReturn {
  const { onSuccess, onError } = options;

  const mutation = useMutation({
    mutationFn: (data: TestWebhookInput) => webhooksService.test(data),
    onSuccess: (response) => {
      onSuccess?.(response);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  return {
    testWebhook: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
