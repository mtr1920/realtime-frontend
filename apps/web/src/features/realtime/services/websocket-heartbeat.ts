/**
 * WebSocket Heartbeat Management
 *
 * Handles ping/pong heartbeat mechanism to detect stale connections.
 */

export interface HeartbeatConfig {
  heartbeatInterval: number;
  heartbeatTimeout: number;
}

export interface HeartbeatCallbacks {
  sendPing: () => void;
  onTimeout: () => void;
}

/**
 * Manages WebSocket heartbeat (ping/pong) to detect stale connections.
 */
export class WebSocketHeartbeat {
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private config: HeartbeatConfig;
  private callbacks: HeartbeatCallbacks;

  constructor(config: HeartbeatConfig, callbacks: HeartbeatCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Start the heartbeat interval
   */
  start(): void {
    this.stop();

    this.heartbeatTimer = setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop the heartbeat interval and clear any pending timeout
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  /**
   * Send a ping and start the pong timeout
   */
  private sendPing(): void {
    this.callbacks.sendPing();

    // Clear any existing timeout before starting new one to prevent timer accumulation
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }

    // Start timeout for pong response
    this.heartbeatTimeoutTimer = setTimeout(() => {
      this.callbacks.onTimeout();
    }, this.config.heartbeatTimeout);
  }

  /**
   * Handle pong response - clears the timeout
   */
  handlePong(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }
}
