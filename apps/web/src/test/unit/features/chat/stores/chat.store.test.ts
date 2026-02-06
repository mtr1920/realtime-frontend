/**
 * Chat Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, selectAllMessages } from '@/features/chat/stores/chat.store';

describe('chat.store', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  describe('addMessage', () => {
    it('should add a message to the store', () => {
      const message = {
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      };

      useChatStore.getState().addMessage(message);

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual(message);
    });

    it('should increment unread count when chat is closed', () => {
      useChatStore.getState().setOpen(false);

      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      expect(useChatStore.getState().unreadCount).toBe(1);
    });

    it('should not increment unread count for own messages', () => {
      useChatStore.getState().setOpen(false);

      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
        isOwn: true,
      });

      expect(useChatStore.getState().unreadCount).toBe(0);
    });

    it('should not increment unread count when chat is open', () => {
      useChatStore.getState().setOpen(true);

      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      expect(useChatStore.getState().unreadCount).toBe(0);
    });

    it('should trim messages to MAX_MESSAGES (500) when exceeded', () => {
      // Add 510 messages
      for (let i = 0; i < 510; i++) {
        useChatStore.getState().addMessage({
          id: `msg-${i}`,
          senderId: 'user-1',
          senderName: 'Alice',
          content: `Message ${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          isPrivate: false,
          isOwn: true,
        });
      }

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(500);
      // First message should be msg-10 (oldest kept)
      expect(messages[0]?.id).toBe('msg-10');
      // Last message should be msg-509 (newest)
      expect(messages[499]?.id).toBe('msg-509');
    });
  });

  describe('pending messages', () => {
    it('should add a pending message', () => {
      const pending = {
        id: 'pending-1',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        correlationTimestamp: '2024-01-24T10:00:00Z',
      };

      useChatStore.getState().addPendingMessage(pending);

      expect(useChatStore.getState().pendingMessages).toHaveLength(1);
      expect(useChatStore.getState().pendingMessages[0]).toEqual(pending);
    });

    it('should confirm a pending message', () => {
      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        correlationTimestamp: '2024-01-24T10:00:00Z',
      });

      const confirmed = {
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      };

      useChatStore.getState().confirmPendingMessage('pending-1', confirmed);

      expect(useChatStore.getState().pendingMessages).toHaveLength(0);
      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]?.isOwn).toBe(true);
    });

    it('should remove a pending message', () => {
      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        correlationTimestamp: '2024-01-24T10:00:00Z',
      });

      useChatStore.getState().removePendingMessage('pending-1');

      expect(useChatStore.getState().pendingMessages).toHaveLength(0);
    });

    it('should trim messages to MAX_MESSAGES when confirming pushes over limit', () => {
      // Add 500 messages first
      for (let i = 0; i < 500; i++) {
        useChatStore.getState().addMessage({
          id: `msg-${i}`,
          senderId: 'user-1',
          senderName: 'Alice',
          content: `Message ${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          isPrivate: false,
          isOwn: true,
        });
      }

      // Add a pending message
      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Pending message',
        timestamp: new Date(Date.now() + 500000).toISOString(),
        correlationTimestamp: new Date(Date.now() + 500000).toISOString(),
      });

      // Confirm it - this should push count to 501 and trim to 500
      useChatStore.getState().confirmPendingMessage('pending-1', {
        id: 'confirmed-1',
        senderId: 'user-1',
        senderName: 'Me',
        content: 'Pending message',
        timestamp: new Date(Date.now() + 500000).toISOString(),
        isPrivate: false,
      });

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(500);
      // Oldest message should be trimmed (msg-0 gone)
      expect(messages[0]?.id).toBe('msg-1');
      // Newest message should be the confirmed one
      expect(messages[499]?.id).toBe('confirmed-1');
    });
  });

  describe('setOpen', () => {
    it('should open the chat', () => {
      useChatStore.getState().setOpen(true);
      expect(useChatStore.getState().isOpen).toBe(true);
    });

    it('should close the chat', () => {
      useChatStore.getState().setOpen(true);
      useChatStore.getState().setOpen(false);
      expect(useChatStore.getState().isOpen).toBe(false);
    });

    it('should reset unread count when opening', () => {
      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      expect(useChatStore.getState().unreadCount).toBe(1);

      useChatStore.getState().setOpen(true);

      expect(useChatStore.getState().unreadCount).toBe(0);
    });
  });

  describe('toggleOpen', () => {
    it('should toggle open state', () => {
      expect(useChatStore.getState().isOpen).toBe(false);

      useChatStore.getState().toggleOpen();
      expect(useChatStore.getState().isOpen).toBe(true);

      useChatStore.getState().toggleOpen();
      expect(useChatStore.getState().isOpen).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should reset unread count', () => {
      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      useChatStore.getState().addMessage({
        id: '2',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello again',
        timestamp: '2024-01-24T10:01:00Z',
        isPrivate: false,
      });

      expect(useChatStore.getState().unreadCount).toBe(2);

      useChatStore.getState().markAsRead();

      expect(useChatStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Pending',
        timestamp: '2024-01-24T10:01:00Z',
        correlationTimestamp: '2024-01-24T10:01:00Z',
      });

      useChatStore.getState().clearMessages();

      expect(useChatStore.getState().messages).toHaveLength(0);
      expect(useChatStore.getState().pendingMessages).toHaveLength(0);
      expect(useChatStore.getState().unreadCount).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });
      useChatStore.getState().setOpen(true);

      useChatStore.getState().reset();

      expect(useChatStore.getState().messages).toHaveLength(0);
      expect(useChatStore.getState().pendingMessages).toHaveLength(0);
      expect(useChatStore.getState().unreadCount).toBe(0);
      expect(useChatStore.getState().isOpen).toBe(false);
    });
  });

  describe('selectAllMessages', () => {
    it('should combine and sort all messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'First',
        timestamp: '2024-01-24T10:00:00Z',
        isPrivate: false,
      });

      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Third',
        timestamp: '2024-01-24T10:02:00Z',
        correlationTimestamp: '2024-01-24T10:02:00Z',
      });

      useChatStore.getState().addMessage({
        id: '2',
        senderId: 'user-2',
        senderName: 'Bob',
        content: 'Second',
        timestamp: '2024-01-24T10:01:00Z',
        isPrivate: false,
      });

      const allMessages = selectAllMessages(useChatStore.getState());

      expect(allMessages).toHaveLength(3);
      expect(allMessages[0]?.content).toBe('First');
      expect(allMessages[1]?.content).toBe('Second');
      expect(allMessages[2]?.content).toBe('Third');
    });

    it('should mark pending messages as own', () => {
      useChatStore.getState().addPendingMessage({
        id: 'pending-1',
        content: 'Pending',
        timestamp: '2024-01-24T10:00:00Z',
        correlationTimestamp: '2024-01-24T10:00:00Z',
      });

      const allMessages = selectAllMessages(useChatStore.getState());

      expect(allMessages[0]?.isOwn).toBe(true);
    });
  });
});
