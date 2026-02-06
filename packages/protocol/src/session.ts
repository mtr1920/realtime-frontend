import { z } from 'zod';

/**
 * Session status
 */
export const SessionStatusSchema = z.enum([
  'scheduled',
  'lobby',
  'active',
  'paused',
  'ended',
]);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Role metadata for display customization
 */
export const RoleMetadataSchema = z.object({
  /** Color for the role (CSS color or Tailwind class) */
  color: z.string().optional(),
  /** Icon name for the role */
  icon: z.string().optional(),
}).optional();

export type RoleMetadata = z.infer<typeof RoleMetadataSchema>;

/**
 * Role definition in session config
 */
export const ConfigRoleSchema = z.object({
  /** Role ID */
  id: z.string(),
  /** Display name for the role */
  name: z.string(),
  /** Display metadata (colors, icons) */
  metadata: RoleMetadataSchema,
});

export type ConfigRole = z.infer<typeof ConfigRoleSchema>;

/**
 * Session configuration
 */
export const SessionConfigSchema = z.object({
  domainType: z.string(),
  enabledModules: z.array(z.string()),
  /** Available roles in the session (from config snapshot) */
  roles: z.array(ConfigRoleSchema).optional(),
  recording: z.object({
    enabled: z.boolean(),
    autoStart: z.boolean(),
  }),
  ai: z.object({
    enabled: z.boolean(),
    provider: z.string().optional(),
  }),
  compliance: z.object({
    enabled: z.boolean(),
    browserLock: z.boolean(),
    identityVerification: z.boolean(),
    screenShare: z
      .object({
        required: z.boolean(),
        requireEntireScreen: z.boolean(),
        forceReshareOnStop: z.boolean(),
      })
      .optional(),
  }),
});

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

/**
 * Session schema
 */
export const SessionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  workspaceId: z.string(),
  status: SessionStatusSchema,
  title: z.string(),
  scheduledStartTime: z.string().datetime().optional(),
  actualStartTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  config: SessionConfigSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;
