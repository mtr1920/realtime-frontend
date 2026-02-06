/**
 * AI Session Utilities
 *
 * Helper functions for AI session management.
 */

// =============================================================================
// Constants
// =============================================================================

/** Timeout for AI session start (10 seconds) */
export const AI_SESSION_START_TIMEOUT = 10000;

/** Timeout for AI turn response (30 seconds) */
export const AI_TURN_TIMEOUT = 30000;

// =============================================================================
// Turn ID Generation
// =============================================================================

/**
 * Generate a unique turn ID for AI conversations
 */
export function generateTurnId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `turn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// Audio Data Conversion
// =============================================================================

/**
 * Convert ArrayBuffer to Base64 string for WebSocket transmission
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string back to ArrayBuffer for audio playback
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
