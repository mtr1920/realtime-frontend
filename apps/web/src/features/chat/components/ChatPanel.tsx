/**
 * ChatPanel Component
 *
 * Main chat panel with message list and input.
 */

import { useRef, useEffect, memo } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatMessage as ChatMessageType } from '../types';

// =============================================================================
// Types
// =============================================================================

interface ChatPanelProps {
  /** Whether chat is enabled for this session */
  enabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Empty State
// =============================================================================

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <MessageSquare
        className="h-12 w-12 text-muted-foreground mb-3"
        aria-hidden="true"
      />
      <h3 className="text-sm font-medium mb-1">No messages yet</h3>
      <p className="text-xs text-muted-foreground">
        Send a message to start the conversation
      </p>
    </div>
  );
}

// =============================================================================
// Message List
// =============================================================================

interface MessageListProps {
  messages: ChatMessageType[];
}

const MessageList = memo(function MessageList({ messages }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  // Determine which messages should show sender
  // (show sender for first message or when sender changes)
  const shouldShowSender = (index: number): boolean => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (!prev || !curr) return true;
    return prev.senderId !== curr.senderId;
  };

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="flex flex-col gap-3">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            showSender={shouldShowSender(index)}
          />
        ))}
        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
});

// =============================================================================
// Component
// =============================================================================

export const ChatPanel = memo(function ChatPanel({
  enabled = true,
  className,
}: ChatPanelProps) {
  const { messages, isSending, sendMessage, markAsRead } = useChat({ enabled });

  // Mark messages as read only on mount
  // Use ref to avoid effect dependency on markAsRead function
  const markAsReadRef = useRef(markAsRead);
  markAsReadRef.current = markAsRead;

  useEffect(() => {
    markAsReadRef.current();
  }, []);

  const handleSend = (content: string) => {
    sendMessage(content).catch(() => {
      // Error handling is done in the hook
    });
  };

  if (!enabled) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <MessageSquare
            className="h-12 w-12 text-muted-foreground mb-3"
            aria-hidden="true"
          />
          <h3 className="text-sm font-medium mb-1">Chat unavailable</h3>
          <p className="text-xs text-muted-foreground">
            Chat is not enabled for this session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      role="region"
      aria-label="Chat"
    >
      {/* Message list */}
      <MessageList messages={messages} />

      {/* Input area */}
      <div className="border-t p-3">
        <ChatInput
          onSend={handleSend}
          isSending={isSending}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
