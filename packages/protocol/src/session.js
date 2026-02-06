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
/**
 * Session configuration
 */
export const SessionConfigSchema = z.object({
    domainType: z.string(),
    enabledModules: z.array(z.string()),
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
    }),
});
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
//# sourceMappingURL=session.js.map