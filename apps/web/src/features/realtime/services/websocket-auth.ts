/**
 * WebSocket Authentication Management
 *
 * Handles token-based authentication and token refresh for WebSocket connections.
 */

import { PROTOCOL_VERSION } from '../types/messages';

export interface AuthConfig {
  token: string;
  sessionId: string;
  authTimeout: number;
  onTokenRefreshNeeded?: () => Promise<{ token: string; expiresAt: string } | null>;
  onError?: (error: Error) => void;
}

export interface AuthCallbacks {
  getSocket: () => WebSocket | null;
  isConnected: () => boolean;
  disconnect: () => void;
  getClientSeq: () => number;
  incrementClientSeq: () => number;
  getLastServerSeq: () => number;
}

/**
 * Manages WebSocket authentication and token refresh.
 */
export class WebSocketAuth {
  private config: AuthConfig;
  private callbacks: AuthCallbacks;
  private authTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenExpiresAt: number | null = null;
  private _isAuthenticated = false;

  constructor(config: AuthConfig, callbacks: AuthCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  setAuthenticated(value: boolean): void {
    this._isAuthenticated = value;
  }

  /**
   * Encode token for WebSocket subprotocol transmission.
   * Uses base64url encoding to handle JWT characters safely.
   */
  encodeTokenForSubprotocol(token: string): string {
    // Convert to base64url (browser-compatible)
    const base64 = btoa(token);
    // Convert base64 to base64url (replace + with -, / with _, remove =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Send authentication message to server.
   * Returns a promise that resolves when auth is confirmed.
   */
  async sendAuthMessage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = this.callbacks.getSocket();
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not open'));
        return;
      }

      // Set up auth timeout
      this.authTimeoutTimer = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, this.config.authTimeout);

      // Create one-time handler for auth response
      const handleAuthResponse = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);

          // Check for auth.success message
          if (message.type === 'auth.success') {
            this.clearAuthTimeout();
            this._isAuthenticated = true;

            // Extract token expiry from response if provided
            if (message.payload?.expiresAt) {
              this.tokenExpiresAt = new Date(message.payload.expiresAt).getTime();
              this.scheduleTokenRefresh();
            }

            resolve();
            return;
          }

          // Check for auth.error message
          if (message.type === 'auth.error' || message.type === 'error') {
            this.clearAuthTimeout();
            const errorMessage = message.payload?.message || 'Authentication failed';
            reject(new Error(errorMessage));
            return;
          }

          // For other messages during auth, keep listening
          // Re-attach listener for next message
          socket.addEventListener('message', handleAuthResponse, { once: true });
        } catch {
          // Invalid JSON, keep listening
          socket.addEventListener('message', handleAuthResponse, { once: true });
        }
      };

      // Listen for auth response
      socket.addEventListener('message', handleAuthResponse, { once: true });

      // Send auth message with token
      const authMessage = {
        v: PROTOCOL_VERSION,
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        type: 'auth',
        sessionId: this.config.sessionId,
        clientSeq: 0,
        lastServerSeq: 0,
        payload: {
          token: this.config.token,
        },
      };

      socket.send(JSON.stringify(authMessage));
    });
  }

  /**
   * Clear auth timeout timer
   */
  clearAuthTimeout(): void {
    if (this.authTimeoutTimer) {
      clearTimeout(this.authTimeoutTimer);
      this.authTimeoutTimer = null;
    }
  }

  /**
   * Schedule token refresh before expiry
   */
  scheduleTokenRefresh(): void {
    this.clearTokenRefreshTimer();

    if (!this.tokenExpiresAt || !this.config.onTokenRefreshNeeded) {
      return;
    }

    // Refresh 60 seconds before expiry
    const refreshAt = this.tokenExpiresAt - 60000;
    const delay = refreshAt - Date.now();

    if (delay <= 0) {
      // Token already expired or about to expire, refresh immediately
      this.refreshToken();
      return;
    }

    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken();
    }, delay);
  }

  /**
   * Clear token refresh timer
   */
  clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Refresh the realtime token
   */
  async refreshToken(): Promise<void> {
    if (!this.config.onTokenRefreshNeeded) {
      return;
    }

    try {
      const result = await this.config.onTokenRefreshNeeded();
      if (result) {
        // Update the config with new token
        this.config.token = result.token;
        this.tokenExpiresAt = new Date(result.expiresAt).getTime();

        // Send token refresh message to server
        const socket = this.callbacks.getSocket();
        if (this.callbacks.isConnected() && socket) {
          const refreshMessage = {
            v: PROTOCOL_VERSION,
            id: crypto.randomUUID(),
            ts: new Date().toISOString(),
            type: 'auth.refresh',
            sessionId: this.config.sessionId,
            clientSeq: this.callbacks.incrementClientSeq(),
            lastServerSeq: this.callbacks.getLastServerSeq(),
            payload: {
              token: result.token,
            },
          };
          socket.send(JSON.stringify(refreshMessage));
        }

        // Schedule next refresh
        this.scheduleTokenRefresh();
      } else {
        // Token refresh failed, disconnect
        this.config.onError?.(new Error('Session token refresh failed'));
        this.callbacks.disconnect();
      }
    } catch (error) {
      this.config.onError?.(
        error instanceof Error ? error : new Error('Token refresh failed')
      );
      this.callbacks.disconnect();
    }
  }

  /**
   * Update the authentication token (for token refresh)
   */
  updateToken(token: string, expiresAt: string): void {
    this.config.token = token;
    this.tokenExpiresAt = new Date(expiresAt).getTime();
    this.scheduleTokenRefresh();
  }

  /**
   * Get the current token
   */
  getToken(): string {
    return this.config.token;
  }

  /**
   * Cleanup all timers
   */
  cleanup(): void {
    this.clearAuthTimeout();
    this.clearTokenRefreshTimer();
  }
}
