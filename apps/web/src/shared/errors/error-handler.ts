/**
 * Central Error Handler
 * Provides unified error handling with toast notifications and error reporting.
 */

import { toast } from 'sonner';
import type { HandleErrorOptions } from './types';
import { getErrorMessage, getErrorSeverity, isAuthError } from './error-messages';
import { reportError } from './error-reporter';

/**
 * Central error handler for API and application errors.
 * Shows appropriate toast notifications and reports errors.
 *
 * @param error - The error to handle
 * @param options - Options to customize error handling
 */
export function handleError(error: unknown, options: HandleErrorOptions = {}): void {
  const { message, severity, silent, context } = options;

  // Don't show toast for auth errors - these are handled by redirect
  if (isAuthError(error) && !message) {
    reportError(error, { context: context ?? 'auth' });
    return;
  }

  // Get user-friendly message
  const displayMessage = message ?? getErrorMessage(error);
  const displaySeverity = severity ?? getErrorSeverity(error);

  // Report error for tracking
  reportError(error, { context });

  // Show toast if not silent
  if (!silent) {
    switch (displaySeverity) {
      case 'info':
        toast.info(displayMessage);
        break;
      case 'warning':
        toast.warning(displayMessage);
        break;
      case 'error':
      default:
        toast.error(displayMessage);
        break;
    }
  }
}

/**
 * Show a success toast notification.
 *
 * @param message - The success message to display
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * Show an info toast notification.
 *
 * @param message - The info message to display
 */
export function showInfo(message: string): void {
  toast.info(message);
}

/**
 * Show a warning toast notification.
 *
 * @param message - The warning message to display
 */
export function showWarning(message: string): void {
  toast.warning(message);
}
