import { z } from 'zod';
/**
 * Participant role definition
 */
export const ParticipantRoleSchema = z.object({
    name: z.string(),
    displayName: z.string(),
    permissions: z.object({
        canPublishAudio: z.boolean(),
        canPublishVideo: z.boolean(),
        canScreenShare: z.boolean(),
        canChat: z.boolean(),
        canEndSession: z.boolean(),
        canRemoveParticipants: z.boolean(),
        canStartRecording: z.boolean(),
        canViewTranscript: z.boolean(),
        canInteractWithAI: z.boolean(),
    }),
});
/**
 * Participant connection state
 */
export const ConnectionStateSchema = z.enum([
    'connecting',
    'connected',
    'reconnecting',
    'disconnected',
]);
/**
 * Participant media state
 */
export const MediaStateSchema = z.object({
    audioEnabled: z.boolean(),
    videoEnabled: z.boolean(),
    screenShareEnabled: z.boolean(),
    isSpeaking: z.boolean(),
});
/**
 * Participant schema
 */
export const ParticipantSchema = z.object({
    id: z.string(),
    userId: z.string(),
    sessionId: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
    role: ParticipantRoleSchema,
    connectionState: ConnectionStateSchema,
    mediaState: MediaStateSchema,
    joinedAt: z.string().datetime(),
});
//# sourceMappingURL=participant.js.map