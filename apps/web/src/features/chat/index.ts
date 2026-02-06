/**
 * Chat Feature
 *
 * Real-time chat functionality for session participants.
 */

// Components
export { ChatPanel } from './components/ChatPanel';
export { ChatMessage } from './components/ChatMessage';
export { ChatInput } from './components/ChatInput';

// Hooks
export { useChat } from './hooks/useChat';
export type { UseChatOptions, UseChatReturn } from './hooks/useChat';

// Store
export { useChatStore, selectAllMessages } from './stores/chat.store';

// Types
export type { ChatMessage as ChatMessageType, PendingMessage, ChatState } from './types';
