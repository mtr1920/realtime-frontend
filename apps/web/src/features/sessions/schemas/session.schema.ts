/**
 * Session Validation Schemas
 * Zod schemas for session form validation.
 */

import { z } from 'zod';

/**
 * Session status enum schema.
 */
export const sessionStatusSchema = z.enum([
  'CREATED',
  'WAITING',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'EXPIRED',
  'FAILED',
]);

export type SessionStatusEnum = z.infer<typeof sessionStatusSchema>;

/**
 * Create session form validation schema.
 * Either configBundleId or roleId must be provided for session creation.
 */
export const createSessionSchema = z
  .object({
    workspaceId: z.string().min(1, 'Workspace is required'),
    roleId: z.string().optional(),
    configBundleId: z.string().optional(),
    externalId: z.string().optional(),
    scheduledAt: z.string().optional(),
    expiresInMinutes: z
      .number()
      .int()
      .min(5, 'Session must be at least 5 minutes')
      .max(480, 'Session cannot exceed 8 hours')
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => data.configBundleId !== undefined || data.roleId !== undefined,
    {
      message: 'Either configBundleId or roleId must be provided',
      path: ['roleId'],
    }
  );

export type CreateSessionFormData = z.infer<typeof createSessionSchema>;

/**
 * Join session form validation schema.
 */
export const joinSessionSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  roleId: z.string().min(1, 'Role is required'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less'),
  userId: z.string().optional(),
});

export type JoinSessionFormData = z.infer<typeof joinSessionSchema>;

/**
 * Session filter schema.
 */
export const sessionFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  status: sessionStatusSchema.optional(),
  search: z.string().optional(),
});

export type SessionFiltersFormData = z.infer<typeof sessionFiltersSchema>;
