/**
 * AI Actor Schema
 * Zod validation schemas for AI actor forms.
 */

import { z } from 'zod';

// =============================================================================
// Enums and Constants
// =============================================================================

export const aiActorRoles = [
  'interviewer',
  'assistant',
  'coach',
  'trainer',
  'sales_expert',
  'moderator',
  'custom',
] as const;

export const personaStyles = [
  'professional',
  'friendly',
  'formal',
  'casual',
  'technical',
  'empathetic',
] as const;

export const personaTraits = [
  'patient',
  'encouraging',
  'direct',
  'thorough',
  'concise',
  'curious',
  'supportive',
] as const;

export const avatarTypes = ['image', 'initials', 'icon', 'animated'] as const;

export const voiceGenders = ['male', 'female', 'neutral'] as const;

// =============================================================================
// Persona Schema
// =============================================================================

export const personaSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  style: z.enum(personaStyles),
  traits: z.array(z.enum(personaTraits)).min(1, 'Select at least one trait'),
  language: z.string().optional(),
});

// =============================================================================
// Voice Schema
// =============================================================================

export const voiceSchema = z.object({
  voiceId: z.string().min(1, 'Voice ID is required'),
  voiceName: z.string().min(1, 'Voice name is required'),
  gender: z.enum(voiceGenders).optional(),
  speakingRate: z.number().min(0.5).max(2.0).optional(),
  pitch: z.number().min(-20).max(20).optional(),
});

// =============================================================================
// Avatar Schema
// =============================================================================

export const avatarSchema = z.object({
  type: z.enum(avatarTypes),
  imageUrl: z.string().url().optional().or(z.literal('')),
  initials: z.string().max(3).optional(),
  iconName: z.string().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
});

// =============================================================================
// AI Actor Schema
// =============================================================================

export const aiActorSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  role: z.enum(aiActorRoles),
  persona: personaSchema,
  voice: voiceSchema,
  avatar: avatarSchema,
  isActive: z.boolean().optional(),
});

export type AIActorFormData = z.infer<typeof aiActorSchema>;

// =============================================================================
// Default Values
// =============================================================================

export const defaultPersona = {
  description: '',
  style: 'professional' as const,
  traits: ['patient' as const],
  language: 'en-US',
};

export const defaultVoice = {
  voiceId: 'alloy',
  voiceName: 'Alloy',
  gender: 'neutral' as const,
  speakingRate: 1.0,
  pitch: 0,
};

export const defaultAvatar = {
  type: 'icon' as const,
  backgroundColor: '#6366f1',
  foregroundColor: '#ffffff',
};

export const defaultAIActor: AIActorFormData = {
  name: '',
  role: 'assistant',
  persona: defaultPersona,
  voice: defaultVoice,
  avatar: defaultAvatar,
};

// =============================================================================
// Labels
// =============================================================================

export const roleLabels: Record<(typeof aiActorRoles)[number], string> = {
  interviewer: 'Interviewer',
  assistant: 'Assistant',
  coach: 'Coach',
  trainer: 'Trainer',
  sales_expert: 'Sales Expert',
  moderator: 'Moderator',
  custom: 'Custom',
};

export const styleLabels: Record<(typeof personaStyles)[number], string> = {
  professional: 'Professional',
  friendly: 'Friendly',
  formal: 'Formal',
  casual: 'Casual',
  technical: 'Technical',
  empathetic: 'Empathetic',
};

export const traitLabels: Record<(typeof personaTraits)[number], string> = {
  patient: 'Patient',
  encouraging: 'Encouraging',
  direct: 'Direct',
  thorough: 'Thorough',
  concise: 'Concise',
  curious: 'Curious',
  supportive: 'Supportive',
};

export const avatarTypeLabels: Record<(typeof avatarTypes)[number], string> = {
  image: 'Image',
  initials: 'Initials',
  icon: 'Icon',
  animated: 'Animated',
};
