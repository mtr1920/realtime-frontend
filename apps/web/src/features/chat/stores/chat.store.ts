/**
 * Chat Store
 *
 * Zustand store for managing chat messages state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatMessage, PendingMessage } from '../types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum number of messages to keep in the store to prevent memory leaks */
const MAX_MESSAGES = 500;

// =============================================================================
// Types
// =============================================================================

interface ChatStore {
  // State
  messages: ChatMessage[];
  pendingMessages: PendingMessage[];
  unreadCount: number;
  isOpen: boolean;

  // Actions
  addMessage: (message: ChatMessage) => void;
  addPendingMessage: (message: PendingMessage) => void;
  confirmPendingMessage: (pendingId: string, confirmedMessage: ChatMessage) => void;
  removePendingMessage: (pendingId: string) => void;
  markAsRead: () => void;
  setOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  clearMessages: () => void;
  reset: () => void;
}

const initialState = {
  messages: [] as ChatMessage[],
  pendingMessages: [] as PendingMessage[],
  unreadCount: 0,
  isOpen: false,
};

// =============================================================================
// Store
// =============================================================================

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      addMessage: (message) =>
        set((state) => {
          state.messages.push(message);
          // Trim to MAX_MESSAGES to prevent memory leaks
          if (state.messages.length > MAX_MESSAGES) {
            state.messages = state.messages.slice(-MAX_MESSAGES);
          }
          // Increment unread count if chat is closed and message is not own
          if (!state.isOpen && !message.isOwn) {
            state.unreadCount++;
          }
        }),

      addPendingMessage: (message) =>
        set((state) => {
          state.pendingMessages.push(message);
        }),

      confirmPendingMessage: (pendingId, confirmedMessage) =>
        set((state) => {
          // Remove from pending
          state.pendingMessages = state.pendingMessages.filter(
            (m) => m.id !== pendingId
          );
          // Add confirmed message (mark as own)
          state.messages.push({ ...confirmedMessage, isOwn: true });
          // Trim to MAX_MESSAGES to prevent memory leaks
          if (state.messages.length > MAX_MESSAGES) {
            state.messages = state.messages.slice(-MAX_MESSAGES);
          }
        }),

      removePendingMessage: (pendingId) =>
        set((state) => {
          state.pendingMessages = state.pendingMessages.filter(
            (m) => m.id !== pendingId
          );
        }),

      markAsRead: () =>
        set((state) => {
          state.unreadCount = 0;
        }),

      setOpen: (isOpen) =>
        set((state) => {
          state.isOpen = isOpen;
          if (isOpen) {
            state.unreadCount = 0;
          }
        }),

      toggleOpen: () =>
        set((state) => {
          state.isOpen = !state.isOpen;
          if (state.isOpen) {
            state.unreadCount = 0;
          }
        }),

      clearMessages: () =>
        set((state) => {
          state.messages = [];
          state.pendingMessages = [];
          state.unreadCount = 0;
        }),

      reset: () => set(() => ({ ...initialState })),
    }))
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectMessages = (state: ChatStore) => state.messages;
export const selectPendingMessages = (state: ChatStore) => state.pendingMessages;
export const selectUnreadCount = (state: ChatStore) => state.unreadCount;
export const selectIsOpen = (state: ChatStore) => state.isOpen;

/**
 * Get all messages (confirmed + pending) sorted by timestamp
 */
export const selectAllMessages = (state: ChatStore) => {
  const pendingAsChat: ChatMessage[] = state.pendingMessages.map((p) => ({
    id: p.id,
    senderId: 'local',
    senderName: 'You',
    content: p.content,
    timestamp: p.timestamp,
    isPrivate: !!p.recipientId,
    isOwn: true,
  }));

  return [...state.messages, ...pendingAsChat].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};
