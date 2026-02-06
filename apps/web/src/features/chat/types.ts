/**
 * Chat Feature Types
 */

/**
 * Chat message from server
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isPrivate: boolean;
  /** Whether this message was sent by the local user */
  isOwn?: boolean;
}

/**
 * Pending message (optimistic update)
 */
export interface PendingMessage {
  id: string;
  content: string;
  recipientId?: string;
  timestamp: string;
  /** Correlation ID for matching server echo (uses timestamp for uniqueness) */
  correlationTimestamp: string;
}

/**
 * Chat configuration
 */
export const CHAT_CONFIG = {
  /** Maximum message length in characters */
  MAX_MESSAGE_LENGTH: 4000,
  /** Maximum messages per minute for rate limiting */
  MAX_MESSAGES_PER_MINUTE: 30,
  /** Rate limit window in milliseconds */
  RATE_LIMIT_WINDOW: 60000,
} as const;

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[];
  pendingMessages: PendingMessage[];
  isLoading: boolean;
  error: string | null;
}
