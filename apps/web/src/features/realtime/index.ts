/**
 * Realtime Feature
 *
 * WebSocket infrastructure for real-time communication.
 */

// Context
export { WebSocketProvider, useWebSocketContext } from './context/WebSocketContext';

// Hooks
export {
  useWebSocket,
  useSubscription,
  useSend,
  useConnection,
  useSessionMessages,
} from './hooks/useWebSocket';
export { useDisconnectNotification } from './hooks/useDisconnectNotification';

// Types
export type {
  WebSocketConnectionState,
  MessageHandler,
  ServerMessagePayloads,
  ClientMessagePayloads,
  // Payload types
  JoinSessionPayload,
  LeaveSessionPayload,
  SessionLeftPayload,
  SessionStatePayload,
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  ParticipantUpdatedPayload,
  OutcomeReadyPayload,
  OutcomeUpdatedPayload,
  ComplianceViolationPayload,
  ComplianceViolation,
  ViolationType,
  ViolationSeverity,
  ViolationAction,
  ErrorPayload,
} from './types/messages';

// Service (for advanced usage)
export type { WebSocketConfig } from './services/websocket.service';
export {
  WebSocketService,
  createWebSocketService,
  getWebSocketService,
  destroyWebSocketService,
} from './services/websocket.service';
