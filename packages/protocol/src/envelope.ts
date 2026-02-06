import { z } from 'zod';

/**
 * Protocol version for compatibility checking.
 * Matches backend packages/protocol/src/version.ts
 */
export const PROTOCOL_VERSION = 1 as const;
export type ProtocolVersion = typeof PROTOCOL_VERSION;

/**
 * Base message envelope for WebSocket communication.
 * Uses 'ts' for timestamp to match backend protocol.
 */
export const BaseEnvelopeSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  id: z.string(),
  ts: z.string().datetime(),
  type: z.string(),
});

/**
 * Client to Server message types.
 * Includes RTC signaling, media control, and AI session messages.
 */
export const ClientMessageTypeSchema = z.enum([
  // Session management
  'session.join',
  'session.leave',
  'session.state.request',
  // Media publishing
  'media.publish',
  'media.unpublish',
  'media.subscribe',
  'media.unsubscribe',
  // Media controls
  'media.toggle',
  'media.screenShare.start',
  'media.screenShare.stop',
  // RTC signaling
  'rtc.offer',
  'rtc.answer',
  'rtc.ice',
  'rtc.iceRestart',
  // Chat
  'chat.message',
  // AI (legacy)
  'ai.start',
  'ai.stop',
  // AI session
  'ai.session.start',
  'ai.session.end',
  'ai.turn.start',
  'ai.turn.end',
  'ai.input.audio.append',
  'ai.input.audio.commit',
  // Heartbeat
  'ping',
]);

export type ClientMessageType = z.infer<typeof ClientMessageTypeSchema>;

/**
 * Server to Client message types
 */
export const ServerMessageTypeSchema = z.enum([
  // Session events
  'session.snapshot',
  'session.left',
  'session.state',
  'session.participant.joined',
  'session.participant.left',
  'session.participant.updated',
  'session.status.changed',
  // Media events
  'media.track.added',
  'media.track.removed',
  'media.state.changed',
  // RTC signaling
  'rtc.offer',
  'rtc.answer',
  'rtc.ice',
  // Chat
  'chat.message',
  // AI (legacy)
  'ai.transcript',
  'ai.status',
  // AI session
  'ai.session.started',
  'ai.session.ended',
  'ai.output.audio.chunk',
  'ai.output.audio.complete',
  'ai.output.text.delta',
  'ai.output.text.complete',
  'ai.error',
  'ai.provider.switched',
  'ai.vad.speechStart',
  'ai.vad.speechEnd',
  // Outcomes
  'outcome.ready',
  'outcome.updated',
  // System
  'error',
  'pong',
]);

export type ServerMessageType = z.infer<typeof ServerMessageTypeSchema>;

/**
 * Message acknowledgment from server
 */
export const MessageAckSchema = z.object({
  id: z.string(),
  status: z.enum(['ok', 'error']),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

export type MessageAck = z.infer<typeof MessageAckSchema>;

/**
 * Client message envelope
 */
export const ClientMessageSchema = BaseEnvelopeSchema.extend({
  type: ClientMessageTypeSchema,
  sessionId: z.string(),
  clientSeq: z.number().int(),
  lastServerSeq: z.number().int(),
  payload: z.record(z.unknown()),
});

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/**
 * Server message envelope
 */
export const ServerMessageSchema = BaseEnvelopeSchema.extend({
  type: ServerMessageTypeSchema,
  serverSeq: z.number().int(),
  payload: z.record(z.unknown()),
  ack: MessageAckSchema.optional(),
});

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
