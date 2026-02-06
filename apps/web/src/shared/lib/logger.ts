/**
 * Dev-Only Logger
 *
 * Provides console logging that only runs in development mode.
 * Use this instead of direct console calls to ensure clean production builds.
 */

type LogArgs = unknown[];

export const logger = {
  /**
   * Log info messages (dev-only)
   */
  info: (message: string, ...args: LogArgs): void => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[DEV] ${message}`, ...args);
    }
  },

  /**
   * Log error messages (dev-only)
   */
  error: (message: string, ...args: LogArgs): void => {
    if (import.meta.env.DEV) {
      console.error(`[DEV] ${message}`, ...args);
    }
  },

  /**
   * Log warning messages (dev-only)
   */
  warn: (message: string, ...args: LogArgs): void => {
    if (import.meta.env.DEV) {
      console.warn(`[DEV] ${message}`, ...args);
    }
  },

  /**
   * Log debug messages (dev-only)
   */
  debug: (message: string, ...args: LogArgs): void => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[DEV] ${message}`, ...args);
    }
  },
};
