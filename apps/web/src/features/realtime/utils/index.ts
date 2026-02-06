export {
  WS_CLOSE_CODES,
  type WsCloseCode,
  CLOSE_CODE_MESSAGES,
  NO_RECONNECT_CODES,
  DELAY_RECONNECT_CODES,
  MAY_RECONNECT_CODES,
  shouldReconnect,
  shouldDelayReconnect,
  isRecoverableError,
  getCloseCodeMessage,
  isAuthError,
  isSessionError,
} from './websocket-errors';
