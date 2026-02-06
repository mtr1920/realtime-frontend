/**
 * WebSocket Close Codes and Error Utilities
 *
 * Centralized constants and helpers for WebSocket close code handling.
 * Aligned with backend websocket-errors.ts definitions.
 */

// =============================================================================
// Close Code Constants
// =============================================================================

/**
 * Standard and custom WebSocket close codes.
 * Custom codes use the 4000-4999 range per RFC 6455.
 */
export const WS_CLOSE_CODES = {
  // Standard WebSocket close codes (RFC 6455)
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  ABNORMAL: 1006,
  POLICY_VIOLATION: 1008,
  SERVER_ERROR: 1011,

  // Custom application close codes (4000-4999)
  GENERIC_ERROR: 4000,
  AUTH_ERROR: 4001,
  INVALID_MESSAGE: 4002,
  NOT_AUTHORIZED: 4003,
  NOT_FOUND: 4004,
  INVALID_STATE: 4009,
  SESSION_EXPIRED: 4010,
  RATE_LIMITED: 4029,
  AI_PROVIDER_ERROR: 4502,
  TAB_CLOSE: 4100,
} as const;

export type WsCloseCode = (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];

// =============================================================================
// Close Reason Messages
// =============================================================================

/**
 * Human-readable messages for each close code.
 */
export const CLOSE_CODE_MESSAGES: Record<number, string> = {
  // Standard codes
  [WS_CLOSE_CODES.NORMAL]: 'Normal closure',
  [WS_CLOSE_CODES.GOING_AWAY]: 'Going away',
  [WS_CLOSE_CODES.PROTOCOL_ERROR]: 'Protocol error',
  [WS_CLOSE_CODES.UNSUPPORTED_DATA]: 'Unsupported data',
  [WS_CLOSE_CODES.ABNORMAL]: 'Connection lost',
  [WS_CLOSE_CODES.POLICY_VIOLATION]: 'Policy violation',
  [WS_CLOSE_CODES.SERVER_ERROR]: 'Server error',

  // Custom codes
  [WS_CLOSE_CODES.GENERIC_ERROR]: 'Generic error',
  [WS_CLOSE_CODES.AUTH_ERROR]: 'Authentication failed',
  [WS_CLOSE_CODES.INVALID_MESSAGE]: 'Invalid message',
  [WS_CLOSE_CODES.NOT_AUTHORIZED]: 'Not authorized',
  [WS_CLOSE_CODES.NOT_FOUND]: 'Not found',
  [WS_CLOSE_CODES.INVALID_STATE]: 'Invalid session state',
  [WS_CLOSE_CODES.SESSION_EXPIRED]: 'Session expired or disconnected',
  [WS_CLOSE_CODES.RATE_LIMITED]: 'Rate limit exceeded',
  [WS_CLOSE_CODES.AI_PROVIDER_ERROR]: 'AI provider unavailable',
  [WS_CLOSE_CODES.TAB_CLOSE]: 'Tab closed',
};

// =============================================================================
// Reconnection Logic
// =============================================================================

/**
 * Codes that should NOT trigger automatic reconnection.
 * These indicate unrecoverable errors or intentional disconnects.
 */
export const NO_RECONNECT_CODES = new Set<number>([
  WS_CLOSE_CODES.NORMAL, // Client/server initiated clean close
  WS_CLOSE_CODES.AUTH_ERROR, // Auth failed - needs new credentials
  WS_CLOSE_CODES.NOT_AUTHORIZED, // Permission denied - kicked, tenant denied
  WS_CLOSE_CODES.NOT_FOUND, // Session/participant doesn't exist
  WS_CLOSE_CODES.INVALID_STATE, // Wrong session status
  WS_CLOSE_CODES.SESSION_EXPIRED, // Session ended or participant disconnected
  WS_CLOSE_CODES.TAB_CLOSE, // Tab closed - intentional disconnect
]);

/**
 * Codes that should delay reconnection (longer backoff).
 * These indicate rate limiting or server overload.
 */
export const DELAY_RECONNECT_CODES = new Set<number>([
  WS_CLOSE_CODES.RATE_LIMITED, // Too many requests - wait longer
]);

/**
 * Codes that may allow reconnection (recoverable errors).
 * These indicate temporary issues that might resolve.
 */
export const MAY_RECONNECT_CODES = new Set<number>([
  WS_CLOSE_CODES.INVALID_MESSAGE, // Client bug - session still valid
  WS_CLOSE_CODES.AI_PROVIDER_ERROR, // AI provider down - may be temporary
]);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a close code should trigger automatic reconnection.
 */
export function shouldReconnect(code: number): boolean {
  return !NO_RECONNECT_CODES.has(code);
}

/**
 * Check if a close code should use extended reconnection delay.
 */
export function shouldDelayReconnect(code: number): boolean {
  return DELAY_RECONNECT_CODES.has(code);
}

/**
 * Check if a close code represents a recoverable error.
 */
export function isRecoverableError(code: number): boolean {
  return MAY_RECONNECT_CODES.has(code) || code === WS_CLOSE_CODES.ABNORMAL;
}

/**
 * Get a human-readable message for a close code.
 */
export function getCloseCodeMessage(code: number, fallbackReason?: string): string {
  return CLOSE_CODE_MESSAGES[code] || fallbackReason || `Connection closed (code: ${code})`;
}

/**
 * Determine if the close was due to authentication/authorization issues.
 */
export function isAuthError(code: number): boolean {
  return (
    code === WS_CLOSE_CODES.AUTH_ERROR ||
    code === WS_CLOSE_CODES.NOT_AUTHORIZED
  );
}

/**
 * Determine if the close was due to session lifecycle issues.
 */
export function isSessionError(code: number): boolean {
  return (
    code === WS_CLOSE_CODES.NOT_FOUND ||
    code === WS_CLOSE_CODES.INVALID_STATE ||
    code === WS_CLOSE_CODES.SESSION_EXPIRED
  );
}
