/**
 * Message Queue
 *
 * Queues outgoing messages when the WebSocket is disconnected
 * and replays them when the connection is restored.
 */

import type { TypedClientMessage, ExtendedClientMessageType } from '../types/messages';

interface QueuedMessage<T extends ExtendedClientMessageType = ExtendedClientMessageType> {
  message: TypedClientMessage<T>;
  timestamp: number;
  attempts: number;
}

interface MessageQueueConfig {
  maxSize: number;
  maxAge: number; // Max age in milliseconds
  maxRetries: number;
}

const DEFAULT_CONFIG: MessageQueueConfig = {
  maxSize: 100,
  maxAge: 30000, // 30 seconds
  maxRetries: 3,
};

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private config: MessageQueueConfig;

  constructor(config: Partial<MessageQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a message to the queue
   */
  enqueue<T extends ExtendedClientMessageType>(message: TypedClientMessage<T>): boolean {
    // Remove expired messages first
    this.pruneExpired();

    // Check queue size limit
    if (this.queue.length >= this.config.maxSize) {
      // Remove oldest message to make room
      this.queue.shift();
    }

    this.queue.push({
      message: message as TypedClientMessage<ExtendedClientMessageType>,
      timestamp: Date.now(),
      attempts: 0,
    });

    return true;
  }

  /**
   * Get all queued messages for replay.
   * Messages are removed from the queue when drained.
   * Failed messages should be re-added via enqueue().
   */
  drain(): TypedClientMessage<ExtendedClientMessageType>[] {
    this.pruneExpired();

    // Get messages that haven't exceeded retry limit
    const messages = this.queue
      .filter((item) => item.attempts < this.config.maxRetries)
      .map((item) => item.message);

    // Clear the queue - successful messages are gone, failed ones get re-enqueued
    this.queue = [];

    return messages;
  }

  /**
   * Get the number of messages in the queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear all messages from the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Remove a specific message from the queue (after successful send)
   */
  remove(messageId: string): boolean {
    const index = this.queue.findIndex(
      (item) => item.message.id === messageId
    );
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove messages that have exceeded maxAge
   */
  private pruneExpired(): void {
    const now = Date.now();
    this.queue = this.queue.filter(
      (item) => now - item.timestamp < this.config.maxAge
    );
  }

  /**
   * Get queue statistics
   */
  getStats(): { size: number; oldestAge: number | null } {
    const firstItem = this.queue[0];
    if (!firstItem) {
      return { size: 0, oldestAge: null };
    }

    const now = Date.now();
    const oldestAge = now - firstItem.timestamp;

    return {
      size: this.queue.length,
      oldestAge,
    };
  }
}
