import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { handleError, reportError, isApiError } from '@/shared/errors';
import type { MutationMeta } from '@/shared/errors';

/**
 * Query client with sensible defaults and global error handlers.
 *
 * Error handling strategy:
 * - Queries: Toast errors only on background refetch failures (not initial loads)
 * - Mutations: Toast errors unless mutation opts out via meta.skipGlobalErrorHandler
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for background refetch errors (not initial loads)
      // Initial load errors should be handled by the component (e.g., error UI)
      if (query.state.data !== undefined) {
        handleError(error, { context: `query:${String(query.queryKey)}` });
      } else {
        // Still report the error, just don't toast it
        reportError(error, { context: `query:${String(query.queryKey)}` });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const meta = mutation.options.meta as MutationMeta | undefined;

      // Skip global handler if mutation handles its own errors
      if (meta?.skipGlobalErrorHandler) {
        return;
      }

      // Show error toast for unhandled mutation errors
      handleError(error, { context: 'mutation' });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (garbage collection)
      refetchOnWindowFocus: false, // Disable aggressive refetching
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (use duck-typing for reliable check)
        if (isApiError(error)) {
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});
