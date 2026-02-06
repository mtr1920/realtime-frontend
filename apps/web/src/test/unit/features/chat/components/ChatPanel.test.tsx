/**
 * ChatPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '@/features/chat/components/ChatPanel';
import { useChatStore } from '@/features/chat/stores/chat.store';

// Mock useChat hook
vi.mock('@/features/chat/hooks/useChat', () => ({
  useChat: vi.fn(),
}));

import { useChat } from '@/features/chat/hooks/useChat';

const mockUseChat = vi.mocked(useChat);

describe('ChatPanel', () => {
  const mockSendMessage = vi.fn();
  const mockSetOpen = vi.fn();
  const mockToggleOpen = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockClearMessages = vi.fn();

  const defaultChatReturn = {
    messages: [],
    unreadCount: 0,
    isOpen: false,
    isSending: false,
    sendMessage: mockSendMessage,
    setOpen: mockSetOpen,
    toggleOpen: mockToggleOpen,
    markAsRead: mockMarkAsRead,
    clearMessages: mockClearMessages,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().reset();
    mockUseChat.mockReturnValue(defaultChatReturn);
    mockSendMessage.mockResolvedValue(undefined);
    // Mock scrollIntoView since jsdom doesn't implement it
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('empty state', () => {
    it('should show empty state when no messages', () => {
      render(<ChatPanel />);

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(
        screen.getByText('Send a message to start the conversation')
      ).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should show unavailable message when disabled', () => {
      render(<ChatPanel enabled={false} />);

      expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
      expect(
        screen.getByText('Chat is not enabled for this session')
      ).toBeInTheDocument();
    });

    it('should not show input when disabled', () => {
      render(<ChatPanel enabled={false} />);

      expect(
        screen.queryByRole('textbox', { name: /chat message/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('with messages', () => {
    it('should render messages', () => {
      mockUseChat.mockReturnValue({
        ...defaultChatReturn,
        messages: [
          {
            id: '1',
            senderId: 'user-1',
            senderName: 'Alice',
            content: 'Hello there!',
            timestamp: '2024-01-24T10:00:00Z',
            isPrivate: false,
          },
          {
            id: '2',
            senderId: 'user-2',
            senderName: 'Bob',
            content: 'Hi Alice!',
            timestamp: '2024-01-24T10:01:00Z',
            isPrivate: false,
          },
        ],
      });

      render(<ChatPanel />);

      expect(screen.getByText('Hello there!')).toBeInTheDocument();
      expect(screen.getByText('Hi Alice!')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should not show sender for own messages', () => {
      mockUseChat.mockReturnValue({
        ...defaultChatReturn,
        messages: [
          {
            id: '1',
            senderId: 'local',
            senderName: 'Me',
            content: 'My message',
            timestamp: '2024-01-24T10:00:00Z',
            isPrivate: false,
            isOwn: true,
          },
        ],
      });

      render(<ChatPanel />);

      expect(screen.getByText('My message')).toBeInTheDocument();
      // Sender name should not be shown for own messages
      expect(screen.queryByText('Me')).not.toBeInTheDocument();
    });

    it('should show private indicator for private messages', () => {
      mockUseChat.mockReturnValue({
        ...defaultChatReturn,
        messages: [
          {
            id: '1',
            senderId: 'user-1',
            senderName: 'Alice',
            content: 'Secret message',
            timestamp: '2024-01-24T10:00:00Z',
            isPrivate: true,
          },
        ],
      });

      render(<ChatPanel />);

      expect(screen.getByText('(private)')).toBeInTheDocument();
    });
  });

  describe('sending messages', () => {
    it('should have input field', () => {
      render(<ChatPanel />);

      expect(
        screen.getByRole('textbox', { name: /chat message/i })
      ).toBeInTheDocument();
    });

    it('should have send button', () => {
      render(<ChatPanel />);

      expect(
        screen.getByRole('button', { name: /send message/i })
      ).toBeInTheDocument();
    });

    it('should call sendMessage when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ChatPanel />);

      const input = screen.getByRole('textbox', { name: /chat message/i });
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should call sendMessage when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ChatPanel />);

      const input = screen.getByRole('textbox', { name: /chat message/i });
      await user.type(input, 'Test message{Enter}');

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatPanel />);

      const input = screen.getByRole('textbox', { name: /chat message/i });
      await user.type(input, 'Test message{Enter}');

      expect(input).toHaveValue('');
    });

    it('should show loading state while sending', () => {
      mockUseChat.mockReturnValue({
        ...defaultChatReturn,
        isSending: true,
      });

      render(<ChatPanel />);

      // Send button should show loading spinner
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('mark as read', () => {
    it('should call markAsRead on mount', () => {
      render(<ChatPanel />);

      expect(mockMarkAsRead).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper region role', () => {
      render(<ChatPanel />);

      expect(screen.getByRole('region', { name: /chat/i })).toBeInTheDocument();
    });
  });
});
