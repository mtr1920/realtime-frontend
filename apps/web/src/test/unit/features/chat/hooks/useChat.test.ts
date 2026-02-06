/**
 * useChat Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/stores/chat.store';

// Mock dependencies
vi.mock('@/features/realtime', () => ({
  useSubscription: vi.fn(),
  useSend: vi.fn(),
}));

vi.mock('@/shared/stores/session.store', () => ({
  useSessionStore: vi.fn(),
}));

import { useSubscription, useSend } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';

const mockUseSubscription = vi.mocked(useSubscription);
const mockUseSend = vi.mocked(useSend);
const mockUseSessionStore = vi.mocked(useSessionStore);

describe('useChat', () => {
  const mockSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().reset();

    mockUseSend.mockReturnValue(mockSend);
    mockUseSessionStore.mockImplementation((selector) => {
      const state = { localParticipantId: 'local-user' };
      return selector(state as never);
    });
    mockUseSubscription.mockImplementation(() => {});
    mockSend.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should return empty messages array', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toHaveLength(0);
    });

    it('should return zero unread count', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.unreadCount).toBe(0);
    });

    it('should return closed state', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isOpen).toBe(false);
    });

    it('should not be sending', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isSending).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send a message via WebSocket', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockSend).toHaveBeenCalledWith('chat.message', {
        content: 'Hello',
        recipientId: undefined,
      });
    });

    it('should send a private message with recipientId', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Private message', 'user-2');
      });

      expect(mockSend).toHaveBeenCalledWith('chat.message', {
        content: 'Private message',
        recipientId: 'user-2',
      });
    });

    it('should trim message content', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('  Hello  ');
      });

      expect(mockSend).toHaveBeenCalledWith('chat.message', {
        content: 'Hello',
        recipientId: undefined,
      });
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('');
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should not send whitespace-only messages', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should add pending message while sending', async () => {
      // Make send hang indefinitely for this test
      mockSend.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useChat());

      // Don't await - we want to check state while pending
      act(() => {
        result.current.sendMessage('Hello');
      });

      await waitFor(() => {
        expect(result.current.isSending).toBe(true);
      });
    });

    it('should remove pending message on error', async () => {
      mockSend.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useChat());

      await expect(
        act(async () => {
          await result.current.sendMessage('Hello');
        })
      ).rejects.toThrow('Failed');

      // Wait for state to update after error handling
      await waitFor(() => {
        expect(result.current.isSending).toBe(false);
      });
    });
  });

  describe('setOpen', () => {
    it('should open the chat panel', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.setOpen(true);
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should close the chat panel', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.setOpen(true);
      });

      act(() => {
        result.current.setOpen(false);
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('toggleOpen', () => {
    it('should toggle the chat panel', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.toggleOpen();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggleOpen();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should reset unread count', () => {
      // Add messages directly to store to simulate incoming messages
      act(() => {
        useChatStore.getState().addMessage({
          id: '1',
          senderId: 'user-1',
          senderName: 'Alice',
          content: 'Hello',
          timestamp: '2024-01-24T10:00:00Z',
          isPrivate: false,
        });
      });

      const { result } = renderHook(() => useChat());

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        result.current.markAsRead();
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      act(() => {
        useChatStore.getState().addMessage({
          id: '1',
          senderId: 'user-1',
          senderName: 'Alice',
          content: 'Hello',
          timestamp: '2024-01-24T10:00:00Z',
          isPrivate: false,
        });
      });

      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe('subscription', () => {
    it('should subscribe to chat.message when enabled', () => {
      renderHook(() => useChat({ enabled: true }));

      expect(mockUseSubscription).toHaveBeenCalledWith(
        'chat.message',
        expect.any(Function),
        true
      );
    });

    it('should not subscribe when disabled', () => {
      renderHook(() => useChat({ enabled: false }));

      expect(mockUseSubscription).toHaveBeenCalledWith(
        'chat.message',
        expect.any(Function),
        false
      );
    });
  });
});
