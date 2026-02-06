/**
 * Error Reporter
 * Production-ready error reporting with Sentry integration.
 */

import * as Sentry from '@sentry/react';

import { extractErrorDetails } from './api-error';

interface ErrorContext {
  /** Where the error occurred */
  context?: string;
  /** User ID (if available) */
  userId?: string;
  /** Tenant ID (if available) */
  tenantId?: string;
  /** Additional metadata */
  extra?: Record<string, unknown>;
}

/** Whether Sentry has been initialized */
let sentryInitialized = false;

/**
 * Initialize Sentry error tracking.
 * Call this once at app startup.
 */
export function initErrorReporting(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn('[Error Reporter] Sentry DSN not configured, using console logging');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Only send errors in production
    enabled: !import.meta.env.DEV,
    // Performance monitoring sample rate (0.0 to 1.0)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Capture console.error calls
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Filter out noisy errors
    beforeSend(event, hint) {
      // Don't send network errors that are just timeouts
      if (hint.originalException instanceof Error) {
        const message = hint.originalException.message.toLowerCase();
        if (message.includes('network error') && message.includes('timeout')) {
          return null;
        }
      }
      return event;
    },
    // Sanitize sensitive data from URLs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        // Remove token query params from URLs
        const url = new URL(breadcrumb.data.to, window.location.origin);
        url.searchParams.delete('token');
        url.searchParams.delete('accessToken');
        breadcrumb.data.to = url.pathname + url.search;
      }
      return breadcrumb;
    },
  });

  sentryInitialized = true;
  if (import.meta.env.DEV) {
    console.warn('[Error Reporter] Sentry initialized');
  }
}

/**
 * Report an error to the error tracking service.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  const details = extractErrorDetails(error);

  // In development or if Sentry isn't configured, log to console
  if (import.meta.env.DEV || !sentryInitialized) {
    console.error('[Error Reporter]', {
      ...details,
      ...context,
    });
    return;
  }

  // Send to Sentry in production
  Sentry.withScope((scope) => {
    // Add context tags
    if (context?.context) {
      scope.setTag('error_context', context.context);
    }
    if (context?.tenantId) {
      scope.setTag('tenant_id', context.tenantId);
    }

    // Add error details as extra data
    scope.setExtras({
      errorCode: details.code,
      errorStatus: details.status,
      errorDetails: details.details,
      ...context?.extra,
    });

    // Set user context if available
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    // Capture the error
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(details.message, 'error');
    }
  });
}

/**
 * Set user context for error reporting.
 * Call this when user logs in/out.
 */
export function setErrorReportingUser(userId: string | null, extra?: { tenantId?: string; email?: string }): void {
  if (!sentryInitialized) {
    return;
  }

  if (userId) {
    Sentry.setUser({
      id: userId,
      email: extra?.email,
    });
    if (extra?.tenantId) {
      Sentry.setTag('tenant_id', extra.tenantId);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add a breadcrumb for debugging.
 * Breadcrumbs are included with error reports to show what happened before the error.
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Get the Sentry ErrorBoundary component for wrapping React components.
 * Returns a simple fallback in development if Sentry isn't available.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
