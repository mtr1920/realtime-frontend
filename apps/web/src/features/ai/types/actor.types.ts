/**
 * AI Actor Types
 *
 * Types for AI actor profiles (persona, voice, avatar).
 * AI actors are configuration-driven and can vary by session type.
 */

// =============================================================================
// AI Actor Definition
// =============================================================================

/**
 * AI actor profile definition.
 */
export interface AIActor {
  /** Unique actor ID */
  id: string;
  /** Display name */
  name: string;
  /** Actor role in the session */
  role: AIActorRole;
  /** Persona configuration */
  persona: AIActorPersona;
  /** Voice configuration */
  voice: AIActorVoice;
  /** Avatar configuration */
  avatar: AIActorAvatar;
  /** Whether this actor is currently active */
  isActive?: boolean;
}

/**
 * AI actor roles.
 */
export type AIActorRole =
  | 'interviewer'
  | 'assistant'
  | 'coach'
  | 'trainer'
  | 'sales_expert'
  | 'moderator'
  | 'custom';

// =============================================================================
// Persona Configuration
// =============================================================================

/**
 * AI actor persona configuration.
 */
export interface AIActorPersona {
  /** Short description of the persona */
  description: string;
  /** Communication style */
  style: PersonaStyle;
  /** Personality traits */
  traits: PersonaTrait[];
  /** Language/locale preference */
  language?: string;
}

/**
 * Communication style for the persona.
 */
export type PersonaStyle =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'casual'
  | 'technical'
  | 'empathetic';

/**
 * Personality traits.
 */
export type PersonaTrait =
  | 'patient'
  | 'encouraging'
  | 'direct'
  | 'thorough'
  | 'concise'
  | 'curious'
  | 'supportive';

// =============================================================================
// Voice Configuration
// =============================================================================

/**
 * AI actor voice configuration.
 */
export interface AIActorVoice {
  /** Voice ID for the AI provider */
  voiceId: string;
  /** Voice name for display */
  voiceName: string;
  /** Voice gender */
  gender?: 'male' | 'female' | 'neutral';
  /** Speaking rate multiplier (0.5-2.0) */
  speakingRate?: number;
  /** Pitch adjustment */
  pitch?: number;
}

// =============================================================================
// Avatar Configuration
// =============================================================================

/**
 * AI actor avatar configuration.
 */
export interface AIActorAvatar {
  /** Avatar type */
  type: 'image' | 'initials' | 'icon' | 'animated';
  /** Image URL (for image type) */
  imageUrl?: string;
  /** Initials text (for initials type) */
  initials?: string;
  /** Icon name (for icon type) */
  iconName?: string;
  /** Background color */
  backgroundColor?: string;
  /** Foreground/text color */
  foregroundColor?: string;
}

// =============================================================================
// Actor Selection
// =============================================================================

/**
 * Selected actor state for a session.
 */
export interface SelectedActor {
  /** Actor ID */
  actorId: string;
  /** When the actor was selected */
  selectedAt: number;
  /** Who selected the actor (participant ID) */
  selectedBy?: string;
}
