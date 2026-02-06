/**
 * User Validation Schemas
 * Zod schemas for user form validation.
 */

import { z } from 'zod';

/**
 * User status enum schema.
 */
export const userStatusSchema = z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']);

export type UserStatusEnum = z.infer<typeof userStatusSchema>;

/**
 * User role enum schema.
 */
export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

export type UserRoleEnum = z.infer<typeof userRoleSchema>;

/**
 * Create user form validation schema.
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .optional()
    .transform((val) => val || undefined),
  role: userRoleSchema,
  metadata: z.record(z.unknown()).optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * Update user form validation schema.
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .optional()
    .transform((val) => val || undefined),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

/**
 * Invite user form validation schema.
 */
export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  role: userRoleSchema,
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

/**
 * User filter schema.
 */
export const userFiltersSchema = z.object({
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  search: z.string().optional(),
});

export type UserFiltersFormData = z.infer<typeof userFiltersSchema>;
