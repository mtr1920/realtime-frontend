import { Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { Toaster } from '@/shared/ui';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import { queryClient } from '@/shared/services/queryClient';
import { createAppRouter } from './router';

// Create router instance with query client
const router = createAppRouter(queryClient);

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OfflineBanner />
            <Suspense fallback={<LoadingScreen />}>
              <RouterProvider router={router} />
            </Suspense>
          </AuthProvider>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
