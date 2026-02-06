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
    canViewComplianceData: z.boolean(),
    // Communication
    canSendPrivateMessages: z.boolean(),
    // Outcome permissions
    canViewOutcome: z.boolean(),
    canEditOutcome: z.boolean(),
    canApproveOutcome: z.boolean(),
    // Phase control
    canAdvancePhase: z.boolean(),
    canRevertPhase: z.boolean(),
  }),
});

export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;

/**
 * Participant connection state
 */
export const ConnectionStateSchema = z.enum([
  'connecting',
  'connected',
  'reconnecting',
  'disconnected',
]);

export type ConnectionState = z.infer<typeof ConnectionStateSchema>;

/**
 * Participant media state
 */
export const MediaStateSchema = z.object({
  audioEnabled: z.boolean(),
  videoEnabled: z.boolean(),
  screenShareEnabled: z.boolean(),
  isSpeaking: z.boolean(),
});

export type MediaState = z.infer<typeof MediaStateSchema>;

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

export type Participant = z.infer<typeof ParticipantSchema>;
