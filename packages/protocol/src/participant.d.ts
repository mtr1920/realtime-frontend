import { z } from 'zod';
/**
 * Participant role definition
 */
export declare const ParticipantRoleSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodString;
    permissions: z.ZodObject<{
        canPublishAudio: z.ZodBoolean;
        canPublishVideo: z.ZodBoolean;
        canScreenShare: z.ZodBoolean;
        canChat: z.ZodBoolean;
        canEndSession: z.ZodBoolean;
        canRemoveParticipants: z.ZodBoolean;
        canStartRecording: z.ZodBoolean;
        canViewTranscript: z.ZodBoolean;
        canInteractWithAI: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        canEndSession: boolean;
        canPublishAudio: boolean;
        canPublishVideo: boolean;
        canScreenShare: boolean;
        canChat: boolean;
        canRemoveParticipants: boolean;
        canStartRecording: boolean;
        canViewTranscript: boolean;
        canInteractWithAI: boolean;
    }, {
        canEndSession: boolean;
        canPublishAudio: boolean;
        canPublishVideo: boolean;
        canScreenShare: boolean;
        canChat: boolean;
        canRemoveParticipants: boolean;
        canStartRecording: boolean;
        canViewTranscript: boolean;
        canInteractWithAI: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    name: string;
    permissions: {
        canEndSession: boolean;
        canPublishAudio: boolean;
        canPublishVideo: boolean;
        canScreenShare: boolean;
        canChat: boolean;
        canRemoveParticipants: boolean;
        canStartRecording: boolean;
        canViewTranscript: boolean;
        canInteractWithAI: boolean;
    };
}, {
    displayName: string;
    name: string;
    permissions: {
        canEndSession: boolean;
        canPublishAudio: boolean;
        canPublishVideo: boolean;
        canScreenShare: boolean;
        canChat: boolean;
        canRemoveParticipants: boolean;
        canStartRecording: boolean;
        canViewTranscript: boolean;
        canInteractWithAI: boolean;
    };
}>;
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;
/**
 * Participant connection state
 */
export declare const ConnectionStateSchema: z.ZodEnum<["connecting", "connected", "reconnecting", "disconnected"]>;
export type ConnectionState = z.infer<typeof ConnectionStateSchema>;
/**
 * Participant media state
 */
export declare const MediaStateSchema: z.ZodObject<{
    audioEnabled: z.ZodBoolean;
    videoEnabled: z.ZodBoolean;
    screenShareEnabled: z.ZodBoolean;
    isSpeaking: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
    isSpeaking: boolean;
}, {
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
    isSpeaking: boolean;
}>;
export type MediaState = z.infer<typeof MediaStateSchema>;
/**
 * Participant schema
 */
export declare const ParticipantSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    displayName: z.ZodString;
    avatarUrl: z.ZodOptional<z.ZodString>;
    role: z.ZodObject<{
        name: z.ZodString;
        displayName: z.ZodString;
        permissions: z.ZodObject<{
            canPublishAudio: z.ZodBoolean;
            canPublishVideo: z.ZodBoolean;
            canScreenShare: z.ZodBoolean;
            canChat: z.ZodBoolean;
            canEndSession: z.ZodBoolean;
            canRemoveParticipants: z.ZodBoolean;
            canStartRecording: z.ZodBoolean;
            canViewTranscript: z.ZodBoolean;
            canInteractWithAI: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        }, {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        name: string;
        permissions: {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        };
    }, {
        displayName: string;
        name: string;
        permissions: {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        };
    }>;
    connectionState: z.ZodEnum<["connecting", "connected", "reconnecting", "disconnected"]>;
    mediaState: z.ZodObject<{
        audioEnabled: z.ZodBoolean;
        videoEnabled: z.ZodBoolean;
        screenShareEnabled: z.ZodBoolean;
        isSpeaking: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        audioEnabled: boolean;
        videoEnabled: boolean;
        screenShareEnabled: boolean;
        isSpeaking: boolean;
    }, {
        audioEnabled: boolean;
        videoEnabled: boolean;
        screenShareEnabled: boolean;
        isSpeaking: boolean;
    }>;
    joinedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: {
        displayName: string;
        name: string;
        permissions: {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        };
    };
    id: string;
    displayName: string;
    sessionId: string;
    userId: string;
    connectionState: "connecting" | "connected" | "reconnecting" | "disconnected";
    mediaState: {
        audioEnabled: boolean;
        videoEnabled: boolean;
        screenShareEnabled: boolean;
        isSpeaking: boolean;
    };
    joinedAt: string;
    avatarUrl?: string | undefined;
}, {
    role: {
        displayName: string;
        name: string;
        permissions: {
            canEndSession: boolean;
            canPublishAudio: boolean;
            canPublishVideo: boolean;
            canScreenShare: boolean;
            canChat: boolean;
            canRemoveParticipants: boolean;
            canStartRecording: boolean;
            canViewTranscript: boolean;
            canInteractWithAI: boolean;
        };
    };
    id: string;
    displayName: string;
    sessionId: string;
    userId: string;
    connectionState: "connecting" | "connected" | "reconnecting" | "disconnected";
    mediaState: {
        audioEnabled: boolean;
        videoEnabled: boolean;
        screenShareEnabled: boolean;
        isSpeaking: boolean;
    };
    joinedAt: string;
    avatarUrl?: string | undefined;
}>;
export type Participant = z.infer<typeof ParticipantSchema>;
//# sourceMappingURL=participant.d.ts.map