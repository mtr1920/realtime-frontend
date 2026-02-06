/**
 * Outcomes Schemas
 * Zod validation schemas for outcome operations.
 */

import { z } from 'zod';

/**
 * Outcome status enum.
 */
export const outcomeStatusSchema = z.enum([
  'pending',
  'generating',
  'ready',
  'approved',
  'rejected',
  'failed',
]);

/**
 * Artifact type enum.
 */
export const artifactTypeSchema = z.enum([
  'transcript',
  'recording',
  'report',
  'log',
  'evidence',
]);

/**
 * Outcome filters schema.
 */
export const outcomeFiltersSchema = z.object({
  status: outcomeStatusSchema.optional(),
  workspaceId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Reject outcome schema.
 */
export const rejectOutcomeSchema = z.object({
  note: z.string().min(10, 'Please provide at least 10 characters explaining the rejection'),
});

// Type exports
export type OutcomeStatusEnum = z.infer<typeof outcomeStatusSchema>;
export type ArtifactTypeEnum = z.infer<typeof artifactTypeSchema>;
export type OutcomeFiltersFormData = z.infer<typeof outcomeFiltersSchema>;
export type RejectOutcomeFormData = z.infer<typeof rejectOutcomeSchema>;
