/**
 * Auth Validation Schemas
 * Zod schemas for auth form validation.
 */

import { z } from 'zod';
import type { UserRole } from '@/types';

// Re-export UserRole from centralized types
export type { UserRole };

/**
 * Login form validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().min(1, 'Please select a workspace'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.input<typeof loginSchema>;

/**
 * User role enum schema for runtime validation.
 */
export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

/**
 * Password requirements for registration/reset.
 */
export const passwordRequirementsSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Registration schema (for future use).
 */
export const registrationSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: passwordRequirementsSchema,
    confirmPassword: z.string(),
    name: z.string().min(1, 'Name is required'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Password reset request schema.
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  tenantId: z.string().min(1, 'Please select a workspace'),
});

export type PasswordResetRequestFormData = z.infer<
  typeof passwordResetRequestSchema
>;

/**
 * Password reset schema.
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1),
    password: passwordRequirementsSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
