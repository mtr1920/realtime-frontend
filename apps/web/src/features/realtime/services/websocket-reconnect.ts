/**
 * WebSocket Reconnection Management
 *
 * Handles automatic reconnection with exponential backoff and jitter.
 */

export interface ReconnectConfig {
  reconnect: boolean;
  maxReconnectAttempts: number;
  initialReconnectDelay: number;
  maxReconnectDelay: number;
  onReconnectAttempt?: (attempt: number, maxAttempts: number) => void;
}

export interface ReconnectCallbacks {
  connect: () => Promise<void>;
  setReconnecting: () => void;
}

/**
 * Manages WebSocket reconnection with exponential backoff.
 */
export class WebSocketReconnect {
  private config: ReconnectConfig;
  private callbacks: ReconnectCallbacks;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectAttempts = 0;

  constructor(config: ReconnectConfig, callbacks: ReconnectCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  get reconnectAttempts(): number {
    return this._reconnectAttempts;
  }

  get maxAttempts(): number {
    return this.config.maxReconnectAttempts;
  }

  get retriesExhausted(): boolean {
    return this._reconnectAttempts >= this.config.maxReconnectAttempts;
  }

  get isEnabled(): boolean {
    return this.config.reconnect;
  }

  /**
   * Reset the reconnection attempt counter
   */
  resetAttempts(): void {
    this._reconnectAttempts = 0;
  }

  /**
   * Schedule a reconnection attempt.
   * @param customDelay Optional custom delay (e.g., for rate limiting)
   */
  scheduleReconnect(customDelay?: number): void {
    this.callbacks.setReconnecting();
    this._reconnectAttempts++;

    // Notify about reconnect attempt
    this.config.onReconnectAttempt?.(
      this._reconnectAttempts,
      this.config.maxReconnectAttempts
    );

    // Use custom delay if provided, otherwise calculate with exponential backoff + jitter
    const delay = customDelay ?? this.calculateBackoff();

    this.reconnectTimer = setTimeout(() => {
      this.callbacks.connect().catch(() => {
        // Will retry in handleClose if attempts remaining
      });
    }, delay);
  }

  /**
   * Calculate backoff delay with jitter
   */
  calculateBackoff(): number {
    // Exponential backoff
    const baseDelay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this._reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );
    // Add +/-20% jitter to prevent thundering herd on mass reconnection
    const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
    return Math.max(0, baseDelay + jitter);
  }

  /**
   * Cancel any pending reconnection
   */
  cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Check if reconnection should be attempted
   */
  shouldReconnect(): boolean {
    return this.config.reconnect && this._reconnectAttempts < this.config.maxReconnectAttempts;
  }
}
