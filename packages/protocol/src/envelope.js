import { z } from 'zod';
/**
 * Base message envelope for WebSocket communication
 */
export const BaseEnvelopeSchema = z.object({
    id: z.string(),
    timestamp: z.string().datetime(),
    type: z.string(),
});
/**
 * Client to Server message types
 */
export const ClientMessageTypeSchema = z.enum([
    'session.join',
    'session.leave',
    'session.state.request',
    'media.publish',
    'media.unpublish',
    'media.subscribe',
    'media.unsubscribe',
    'chat.message',
    'ai.start',
    'ai.stop',
    'ping',
]);
/**
 * Server to Client message types
 */
export const ServerMessageTypeSchema = z.enum([
    'session.joined',
    'session.left',
    'session.state',
    'session.participant.joined',
    'session.participant.left',
    'session.participant.updated',
    'media.track.added',
    'media.track.removed',
    'chat.message',
    'ai.transcript',
    'ai.status',
    'error',
    'pong',
]);
/**
 * Client message envelope
 */
export const ClientMessageSchema = BaseEnvelopeSchema.extend({
    type: ClientMessageTypeSchema,
    payload: z.record(z.unknown()),
});
/**
 * Server message envelope
 */
export const ServerMessageSchema = BaseEnvelopeSchema.extend({
    type: ServerMessageTypeSchema,
    payload: z.record(z.unknown()),
});
//# sourceMappingURL=envelope.js.map