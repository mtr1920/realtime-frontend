import { enableMapSet } from 'immer';
enableMapSet();

// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initErrorReporting, setErrorReportingUser } from '@/shared/errors/error-reporter';
import { useAuthStore } from '@/shared/stores/auth.store';
import { queryClient } from '@/shared/services/queryClient';
import { queryKeys } from '@/shared/services/query-keys';
import type { User } from '@/types';

import { App } from './App';
import '@/index.css';

// Initialize error reporting (Sentry) before anything else
initErrorReporting();

// Subscribe to auth state changes to update Sentry user context
// When authenticated, get user from TanStack Query cache
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      // Try to get user from cache
      const user = queryClient.getQueryData<User>(queryKeys.auth.user());
      if (user) {
        setErrorReportingUser(user.id, {
          email: user.email,
          tenantId: user.tenantId,
        });
      }
      // Also listen for cache updates when user data is fetched
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.query.queryKey[0] === 'auth' &&
          event.query.queryKey[1] === 'user'
        ) {
          const cachedUser = event.query.state.data as User | undefined;
          if (cachedUser) {
            setErrorReportingUser(cachedUser.id, {
              email: cachedUser.email,
              tenantId: cachedUser.tenantId,
            });
          }
        }
      });
      // Store unsubscribe for cleanup (in a real app, manage this better)
      (window as { __queryUnsubscribe?: () => void }).__queryUnsubscribe = unsubscribe;
    } else {
      // Clear user on logout
      setErrorReportingUser(null);
      // Cleanup query cache subscription
      const unsubscribe = (window as { __queryUnsubscribe?: () => void }).__queryUnsubscribe;
      if (unsubscribe) {
        unsubscribe();
      }
    }
  },
  { fireImmediately: true }
);

// Fade out and remove the initial CSS-only loader
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  initialLoader.classList.add('hidden');
  setTimeout(() => initialLoader.remove(), 200);
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check your index.html.');
}

createRoot(rootElement).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
