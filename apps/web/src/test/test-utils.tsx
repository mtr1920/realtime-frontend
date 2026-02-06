/**
 * Test Utilities
 *
 * Shared testing helpers for rendering components with providers,
 * mocking queries, and simulating user interactions.
 */

import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/app/providers/ThemeProvider';

// =============================================================================
// Query Client Factory
// =============================================================================

/**
 * Create a fresh QueryClient for testing.
 * Disables retries and logging for cleaner test output.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// =============================================================================
// Provider Wrapper
// =============================================================================

interface WrapperProps {
  children: ReactNode;
}

interface ProviderOptions {
  /** Custom QueryClient instance */
  queryClient?: QueryClient;
}

/**
 * Create a wrapper component with all providers.
 */
function createWrapper(options: ProviderOptions = {}) {
  const { queryClient = createTestQueryClient() } = options;

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  };
}

// =============================================================================
// Custom Render
// =============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providerOptions?: ProviderOptions;
}

interface CustomRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
  queryClient: QueryClient;
}

/**
 * Render a component with all providers and user event setup.
 *
 * @example
 * ```tsx
 * const { user, getByRole } = renderWithProviders(<MyComponent />);
 * await user.click(getByRole('button'));
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const { providerOptions = {}, ...renderOptions } = options;
  const queryClient = providerOptions.queryClient ?? createTestQueryClient();

  const user = userEvent.setup();

  const result = render(ui, {
    wrapper: createWrapper({ ...providerOptions, queryClient }),
    ...renderOptions,
  });

  return {
    ...result,
    user,
    queryClient,
  };
}

// =============================================================================
// Query Helpers
// =============================================================================

/**
 * Set cached query data for testing.
 *
 * @example
 * ```tsx
 * const queryClient = createTestQueryClient();
 * setQueryData(queryClient, ['sessions', 'list'], mockSessions);
 * ```
 */
export function setQueryData<TData>(
  queryClient: QueryClient,
  queryKey: unknown[],
  data: TData
): void {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Get query state for assertions.
 */
export function getQueryState<TData>(
  queryClient: QueryClient,
  queryKey: unknown[]
): { data: TData | undefined; status: 'pending' | 'error' | 'success' } {
  const state = queryClient.getQueryState(queryKey);
  return {
    data: state?.data as TData | undefined,
    status: state?.status ?? 'pending',
  };
}

// =============================================================================
// Wait Helpers
// =============================================================================

/**
 * Wait for a condition to be true.
 *
 * @example
 * ```tsx
 * await waitFor(() => expect(getByText('Loaded')).toBeInTheDocument());
 * ```
 */
export { waitFor, waitForElementToBeRemoved, screen, within, act } from '@testing-library/react';

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * Create a mock function that tracks calls and can be controlled.
 */
export { vi } from 'vitest';

/**
 * Flush all pending promises.
 * Useful for waiting for async state updates.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Advance timers and flush promises.
 * Use with vi.useFakeTimers().
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  const { vi } = await import('vitest');
  vi.advanceTimersByTime(ms);
  await flushPromises();
}

// =============================================================================
// Re-exports
// =============================================================================

export { renderHook } from '@testing-library/react';
export type { RenderHookResult } from '@testing-library/react';
