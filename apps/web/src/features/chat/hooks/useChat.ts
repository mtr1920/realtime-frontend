/**
 * useChat Hook
 *
 * Provides chat functionality with WebSocket integration.
 * Includes rate limiting, input validation, and optimistic updates.
 */

import { useCallback, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSubscription, useSend } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import { useChatStore } from '../stores/chat.store';
import { CHAT_CONFIG } from '../types';
import type { ChatMessage } from '../types';
import { logger } from '@/shared/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface UseChatOptions {
  /** Enable chat functionality */
  enabled?: boolean;
  /** Callback when a new message is received */
  onMessageReceived?: (message: ChatMessage) => void;
}

export interface UseChatReturn {
  /** All messages (confirmed + pending) sorted by timestamp */
  messages: ChatMessage[];
  /** Number of unread messages */
  unreadCount: number;
  /** Whether the chat panel is open */
  isOpen: boolean;
  /** Whether a message is being sent */
  isSending: boolean;
  /** Send a message */
  sendMessage: (content: string, recipientId?: string) => Promise<void>;
  /** Open/close the chat panel */
  setOpen: (isOpen: boolean) => void;
  /** Toggle the chat panel */
  toggleOpen: () => void;
  /** Mark all messages as read */
  markAsRead: () => void;
  /** Clear all messages */
  clearMessages: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { enabled = true, onMessageReceived } = options;

  // Rate limiting state
  const messageSendTimes = useRef<number[]>([]);

  // Store state - use useShallow to prevent excessive re-renders
  const { confirmedMessages, pendingMessages, unreadCount, isOpen } = useChatStore(
    useShallow((s) => ({
      confirmedMessages: s.messages,
      pendingMessages: s.pendingMessages,
      unreadCount: s.unreadCount,
      isOpen: s.isOpen,
    }))
  );

  // Compute combined messages with memoization
  const messages = useMemo(() => {
    const pendingAsChat: ChatMessage[] = pendingMessages.map((p) => ({
      id: p.id,
      senderId: 'local',
      senderName: 'You',
      content: p.content,
      timestamp: p.timestamp,
      isPrivate: !!p.recipientId,
      isOwn: true,
    }));

    return [...confirmedMessages, ...pendingAsChat].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [confirmedMessages, pendingMessages]);

  // Store actions - stable references
  const storeActions = useChatStore(
    useShallow((s) => ({
      addPendingMessage: s.addPendingMessage,
      removePendingMessage: s.removePendingMessage,
      markAsRead: s.markAsRead,
      setOpen: s.setOpen,
      toggleOpen: s.toggleOpen,
      clearMessages: s.clearMessages,
    }))
  );

  // WebSocket send function
  const send = useSend();

  // Subscribe to incoming chat messages with error handling
  useSubscription(
    'chat.message',
    useCallback(
      (payload) => {
        try {
          const localId = useSessionStore.getState().localParticipantId;
          const message: ChatMessage = {
            id: payload.id,
            senderId: payload.senderId,
            senderName: payload.senderName,
            content: payload.content,
            timestamp: payload.timestamp,
            isPrivate: payload.isPrivate,
            isOwn: payload.senderId === localId,
          };

          // Check if this confirms a pending message
          // Use correlation timestamp for matching to avoid race conditions
          const currentPending = useChatStore.getState().pendingMessages;
          const pendingMatch = currentPending.find(
            (p) =>
              p.content === message.content &&
              message.isOwn &&
              // Match within a 5 second window to handle network delays
              Math.abs(
                new Date(p.correlationTimestamp).getTime() -
                  new Date(message.timestamp).getTime()
              ) < 5000
          );

          if (pendingMatch) {
            useChatStore.getState().confirmPendingMessage(pendingMatch.id, message);
          } else {
            useChatStore.getState().addMessage(message);
            onMessageReceived?.(message);
          }
        } catch (error) {
          logger.error('[useChat] Error handling chat message:', error);
        }
      },
      [onMessageReceived]
    ),
    enabled
  );

  // Send message handler with validation and rate limiting
  const sendMessage = useCallback(
    async (content: string, recipientId?: string) => {
      const trimmed = content.trim();

      // Validate empty
      if (!trimmed) return;

      // Validate length
      if (trimmed.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
        throw new Error(
          `Message too long (max ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters)`
        );
      }

      // Rate limiting check
      const now = Date.now();
      messageSendTimes.current = messageSendTimes.current.filter(
        (time) => now - time < CHAT_CONFIG.RATE_LIMIT_WINDOW
      );

      if (messageSendTimes.current.length >= CHAT_CONFIG.MAX_MESSAGES_PER_MINUTE) {
        throw new Error('Too many messages. Please wait before sending more.');
      }

      messageSendTimes.current.push(now);

      // Create pending message with correlation timestamp
      const pendingId = crypto.randomUUID();
      const correlationTimestamp = new Date().toISOString();
      const pendingMessage = {
        id: pendingId,
        content: trimmed,
        recipientId,
        timestamp: correlationTimestamp,
        correlationTimestamp,
      };

      storeActions.addPendingMessage(pendingMessage);

      try {
        await send('chat.message', {
          content: trimmed,
          recipientId,
        });
        // Message will be confirmed when server echoes it back
      } catch (error) {
        // Remove pending message on error
        storeActions.removePendingMessage(pendingId);
        throw error;
      }
    },
    [send, storeActions]
  );

  // Derive isSending from pending messages
  const isSending = pendingMessages.length > 0;

  return {
    messages,
    unreadCount,
    isOpen,
    isSending,
    sendMessage,
    setOpen: storeActions.setOpen,
    toggleOpen: storeActions.toggleOpen,
    markAsRead: storeActions.markAsRead,
    clearMessages: storeActions.clearMessages,
  };
}
