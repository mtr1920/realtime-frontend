import { z } from 'zod';
/**
 * Base message envelope for WebSocket communication
 */
export declare const BaseEnvelopeSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
    type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    timestamp: string;
}, {
    id: string;
    type: string;
    timestamp: string;
}>;
/**
 * Client to Server message types
 */
export declare const ClientMessageTypeSchema: z.ZodEnum<["session.join", "session.leave", "session.state.request", "media.publish", "media.unpublish", "media.subscribe", "media.unsubscribe", "chat.message", "ai.start", "ai.stop", "ping"]>;
export type ClientMessageType = z.infer<typeof ClientMessageTypeSchema>;
/**
 * Server to Client message types
 */
export declare const ServerMessageTypeSchema: z.ZodEnum<["session.joined", "session.left", "session.state", "session.participant.joined", "session.participant.left", "session.participant.updated", "media.track.added", "media.track.removed", "chat.message", "ai.transcript", "ai.status", "error", "pong"]>;
export type ServerMessageType = z.infer<typeof ServerMessageTypeSchema>;
/**
 * Client message envelope
 */
export declare const ClientMessageSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
} & {
    type: z.ZodEnum<["session.join", "session.leave", "session.state.request", "media.publish", "media.unpublish", "media.subscribe", "media.unsubscribe", "chat.message", "ai.start", "ai.stop", "ping"]>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "ping" | "session.join" | "session.leave" | "session.state.request" | "media.publish" | "media.unpublish" | "media.subscribe" | "media.unsubscribe" | "chat.message" | "ai.start" | "ai.stop";
    timestamp: string;
    payload: Record<string, unknown>;
}, {
    id: string;
    type: "ping" | "session.join" | "session.leave" | "session.state.request" | "media.publish" | "media.unpublish" | "media.subscribe" | "media.unsubscribe" | "chat.message" | "ai.start" | "ai.stop";
    timestamp: string;
    payload: Record<string, unknown>;
}>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
/**
 * Server message envelope
 */
export declare const ServerMessageSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
} & {
    type: z.ZodEnum<["session.joined", "session.left", "session.state", "session.participant.joined", "session.participant.left", "session.participant.updated", "media.track.added", "media.track.removed", "chat.message", "ai.transcript", "ai.status", "error", "pong"]>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "error" | "chat.message" | "session.joined" | "session.left" | "session.state" | "session.participant.joined" | "session.participant.left" | "session.participant.updated" | "media.track.added" | "media.track.removed" | "ai.transcript" | "ai.status" | "pong";
    timestamp: string;
    payload: Record<string, unknown>;
}, {
    id: string;
    type: "error" | "chat.message" | "session.joined" | "session.left" | "session.state" | "session.participant.joined" | "session.participant.left" | "session.participant.updated" | "media.track.added" | "media.track.removed" | "ai.transcript" | "ai.status" | "pong";
    timestamp: string;
    payload: Record<string, unknown>;
}>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
//# sourceMappingURL=envelope.d.ts.map